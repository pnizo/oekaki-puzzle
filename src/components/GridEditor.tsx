import { useState } from 'react';
import { generatePuzzleFromGrid } from '@/utils/puzzleUtils';

interface GridEditorProps {
  width: number;
  height: number;
  onSave: (colors: string[], puzzleData: number[]) => void;
}

const PALETTE = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#00FFFF", "#FF00FF", "#C0C0C0", "#808080",
  "#800000", "#808000", "#008000", "#800080", "#008080", "#000080"
];

export default function GridEditor({ width, height, onSave }: GridEditorProps) {
  const [colors, setColors] = useState<string[]>(Array(width * height).fill("#FFFFFF"));
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewData, setPreviewData] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);



  const handleMouseDown = (index: number) => {
    setIsDrawing(true);
    updateColor(index);
  };

  const handleMouseEnter = (index: number) => {
    if (isDrawing) {
      updateColor(index);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const updateColor = (index: number) => {
    const newColors = [...colors];
    newColors[index] = selectedColor;
    setColors(newColors);
    setPreviewData(null); // Clear preview on change
  };

  const handlePreview = () => {
    try {
      const { data, isValid } = generatePuzzleFromGrid(colors, width, height);
      if (!isValid) {
        setError("パズルが無効です：少なくとも1つの暗いセルを描いてね");
        setPreviewData(null);
      } else {
        setError(null);
        setPreviewData(data);
      }
    } catch (e) {
      setError("Error generating preview");
    }
  };

  const handleSaveClick = () => {
    if (!previewData) {
      handlePreview();
      return;
    }
    onSave(colors, previewData);
  };

  return (
    <div className="flex flex-col items-center space-y-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Palette */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {PALETTE.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden"
        />
      </div>

      {/* Grid */}
      <div
        className="grid gap-px bg-gray-300 border border-gray-300 select-none touch-none"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(20px, 40px))`,
          width: 'fit-content'
        }}
      >
        {colors.map((color, i) => (
          <div
            key={i}
            className="aspect-square cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: color }}
            onMouseDown={() => handleMouseDown(i)}
            onMouseEnter={() => handleMouseEnter(i)}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handlePreview}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          プレビュー
        </button>
        <button
          onClick={handleSaveClick}
          disabled={!!error && !previewData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          次へ
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Preview */}
      {previewData && (
        <div className="mt-4 p-4 border rounded bg-white">
          <h3 className="text-lg font-bold mb-2 text-center">プレビュー</h3>
          <div
            className="grid gap-px bg-gray-300 border border-gray-300"
            style={{
              gridTemplateColumns: `repeat(${width}, 20px)`,
              width: 'fit-content',
              margin: '0 auto'
            }}
          >
            {previewData.map((cell, i) => (
              <div
                key={i}
                className="aspect-square"
                style={{ backgroundColor: cell === 1 ? '#000' : '#fff' }}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">平均より暗いセルが黒くなるよ</p>
        </div>
      )}
    </div>
  );
}
