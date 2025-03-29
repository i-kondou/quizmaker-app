import React, { useState, useEffect } from "react";

export interface HeritageData {
  title: string;
  description: string;
  criteria: number[];
}

interface HeritageResponse {
  content: HeritageData[];
}

interface HeritageAccordionItemProps {
  item: HeritageData;
  onSave?: (updated: HeritageData) => void;
}

const HeritageAccordionItem: React.FC<HeritageAccordionItemProps> = ({
  item,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [localItem, setLocalItem] = useState<HeritageData>(item);

  // もし item が変わったとき、編集中でなければ更新する
  useEffect(() => {
    if (!isEditing) {
      setLocalItem(item);
    }
  }, [item, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) {
      onSave(localItem);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalItem(item);
  };

  return (
    <div className="border rounded mb-2">
      {/* ヘッダー：クリックで開閉 */}
      <div
        className="cursor-pointer p-2 bg-gray-100 flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold">{item.title}</span>
        <span className="text-xl">{isOpen ? "−" : "+"}</span>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="p-2">
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">名称:</label>
                <input
                  type="text"
                  value={localItem.title}
                  onChange={(e) =>
                    setLocalItem({ ...localItem, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">説明:</label>
                <textarea
                  value={localItem.description}
                  onChange={(e) =>
                    setLocalItem({ ...localItem, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">登録基準:</label>
                <input
                  type="text"
                  value={localItem.criteria.join(", ")}
                  onChange={(e) => {
                    const nums = e.target.value
                      .split(",")
                      .map((s) => Number(s.trim()))
                      .filter((n) => !isNaN(n));
                    setLocalItem({ ...localItem, criteria: nums });
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  編集完了
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p>
                <strong>名称:</strong> {item.title}
              </p>
              <p>
                <strong>説明:</strong> {item.description}
              </p>
              <p>
                <strong>登録基準:</strong> {item.criteria.join(", ")}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                編集
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeritageAccordionItem;
