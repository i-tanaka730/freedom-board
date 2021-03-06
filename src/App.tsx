import React, { useState, useEffect } from "react";
import { firebaseDb } from "./firebase";
import "./App.css";

let db: firebase.database.Reference | null = null;

type Item = { t: string; x: number; y: number; c: number };
type Items = { [key: string]: Item };

// 指定可能なカラーの一覧
const CORLORS = ["#FFF", "#FFB6C1", "#F0E68C", "#87cefa"];

const App: React.FC = () => {
  const [items, setItems] = useState<Items | null>(null);
  const [dragging, setDragging] = useState({ key: "", x: 0, y: 0 });

  const [input, setInput] = useState("");
  const [editMode, setEditMode] = useState({ key: "", w: 0, h: 0 });

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/") {
      // ルーム作成ポップアップ
      const roomName = window.prompt("please input room's name") as string;
      window.location.href = roomName;
    }
    // パス名から対象のDBを取得する
    db = firebaseDb.ref(window.location.pathname);
    db.on("value", (value) => setItems(value.val()));
  }, []);

  // 追加処理
  const add = () => {
    const newPostKey = db?.push().key as string;
    db?.update({
      [newPostKey]: {
        t: "テキストを入力",
        x: window.scrollX + Math.floor(Math.random() * (200 - 80) + 80),
        y: window.scrollY + Math.floor(Math.random() * (200 - 80) + 80),
        c: 5,
      },
    });
  };

  // 更新処理
  const update = (key: string, item: Item) => db?.update({ [key]: item });

  // 削除処理
  const remove = (key: string) => db?.child(key).remove();

  if (!items)
    return (
			<div className="Board">
				<button className="AddCard" onClick={() => add()}>
					カードを追加
				</button>
			</div>
    );

  return (
    <div
      className="Board"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (!dragging || !items) return;
        update(dragging.key, {
          ...items[dragging.key],
          x: e.clientX - dragging.x,
          y: e.clientY - dragging.y,
        });
      }}
    >
      <button className="AddCard" onClick={() => add()}>
        カードを追加
      </button>
      <div>
        {Object.keys(items).map((key) => (
          <div
            key={key}
            style={{
              left: items[key].x + "px",
              top: items[key].y + "px",
              background: CORLORS[items[key].c],
            }}
            draggable
            className="Card"
            onDragStart={(e) =>
              setDragging({
                key,
                x: e.clientX - items[key].x,
                y: e.clientY - items[key].y,
              })
            }
          >
            <button className="DeleteBtn" onClick={() => remove(key)}>
              ×
            </button>
            <div className="ColorSelector">
              {CORLORS.map((c, i) => (
                <div
                  key={c}
                  className="ColorCircle"
                  onClick={() => {
                    update(key, { ...items[key], c: i });
                  }}
                  style={{ background: c }}
                />
              ))}
            </div>
            {editMode.key === key ? (
              <textarea
                className="EditableText"
                style={{ width: editMode.w, height: editMode.h }}
                onChange={(e) => setInput(e.target.value)}
                defaultValue={items[key].t}
                autoFocus
                onFocus={(e) => e.target.select()}
                onBlur={() => {
                  setInput("");
                  setEditMode({ key: "", w: 0, h: 0 });
                  input && update(key, { ...items[key], t: input });
                }}
              />
            ) : (
              <pre
                className="Text"
                onClick={(e) =>
                  setEditMode({
                    key,
                    w: e.currentTarget.clientWidth,
                    h: e.currentTarget.clientHeight,
                  })
                }
              >
                {items[key].t}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
