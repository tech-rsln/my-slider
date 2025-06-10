/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useRef, useCallback } from "react";

// Mock components - Responsive to container size
const Card = ({
  title = "Card Title",
  content = "Card content",
  width,
  height,
}: {
  title?: string;
  content?: string;
  width: number;
  height: number;
}) => (
  <div
    className="bg-white p-4 rounded-lg shadow-md border w-full h-full flex flex-col"
    style={{ minWidth: width, minHeight: height }}
  >
    <h3 className="font-bold text-sm mb-2 overflow-hidden">{title}</h3>
    <p className="text-xs text-gray-600 flex-1 overflow-hidden">{content}</p>
  </div>
);

const Typography = ({
  text = "Sample Text",
  size = "lg",
  width,
  height,
}: {
  text?: string;
  size?: string;
  width: number;
  height: number;
}) => {
  const getFontSize = (
    size: string,
    containerWidth: number,
    containerHeight: number
  ) => {
    const baseSize =
      {
        sm: 12,
        base: 14,
        lg: 16,
        xl: 20,
        "2xl": 24,
      }[size] || 16;

    // Adjust font size based on container size
    const widthFactor = Math.min(containerWidth / 150, 2);
    const heightFactor = Math.min(containerHeight / 60, 2);
    const scaleFactor = Math.min(widthFactor, heightFactor);

    return Math.max(10, Math.floor(baseSize * scaleFactor));
  };

  return (
    <div
      className="bg-blue-50 p-2 rounded w-full h-full flex items-center justify-center"
      style={{ minWidth: "80px", minHeight: "40px" }}
    >
      <p
        className="font-semibold text-center overflow-hidden"
        style={{
          fontSize: `${getFontSize(size, width, height)}px`,
          lineHeight: "1.2",
        }}
      >
        {text}
      </p>
    </div>
  );
};

interface IComponent {
  id: string;
  name: string;
  component: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: any;
}

interface IPage {
  id: number;
  title: string;
  components: IComponent[];
}

interface HistoryState {
  pages: IPage[];
  activePage: number;
}

const availableComponents = [
  {
    name: "Card",
    component: <Card width={200} height={120} />,
    defaultProps: { title: "Card Title", content: "Card content" },
    defaultSize: { width: 200, height: 120 },
  },
  {
    name: "Typography",
    component: <Typography width={150} height={60} />,
    defaultProps: { text: "Sample Text", size: "lg" },
    defaultSize: { width: 150, height: 60 },
  },
];

const Page = () => {
  const [pages, setPages] = useState<IPage[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [draggedComponent, setDraggedComponent] = useState<IComponent | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{
    componentId: string;
    handle: string;
  } | null>(null);
  const [clipboard, setClipboard] = useState<IComponent | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);

  // History management
  const saveToHistory = useCallback(
    (newPages: IPage[], newActivePage: number) => {
      const newState: HistoryState = {
        pages: newPages,
        activePage: newActivePage,
      };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);

      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }

      setHistory(newHistory);
    },
    [history, historyIndex]
  );

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPages(prevState.pages);
      setActivePage(prevState.activePage);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPages(nextState.pages);
      setActivePage(nextState.activePage);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const updatePages = (newPages: IPage[]) => {
    setPages(newPages);
    saveToHistory(newPages, activePage);
  };

  const handleAdd = () => {
    const newPages = [
      ...pages,
      {
        id: pages.length + 1,
        title: `Page ${pages.length + 1}`,
        components: [],
      },
    ];
    updatePages(newPages);
  };

  const handleDoubleClick = (id: number) => {
    setActivePage(id);
    setSelectedComponent(null);
  };

  // Component library'den drag başlatma
  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    componentName: string
  ) => {
    event.dataTransfer.setData("componentName", componentName);
    event.dataTransfer.setData("source", "library");
  };

  // Slide içindeki component drag başlatma
  const handleComponentDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    component: IComponent
  ) => {
    event.stopPropagation();
    if (resizing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedComponent(component);
    event.dataTransfer.setData("componentId", component.id);
    event.dataTransfer.setData("source", "slide");
  };

  // Slide'a drop işlemi
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const source = event.dataTransfer.getData("source");
    const rect = event.currentTarget.getBoundingClientRect();

    if (source === "library") {
      // Library'den yeni component ekleme
      const componentName = event.dataTransfer.getData("componentName");
      const selectedComp = availableComponents.find(
        (q) => q.name === componentName
      );

      if (selectedComp) {
        const newComponent: IComponent = {
          id: `${componentName}-${Date.now()}`,
          name: componentName,
          component:
            componentName === "Card" ? (
              <Card
                {...selectedComp.defaultProps}
                width={selectedComp.defaultSize.width}
                height={selectedComp.defaultSize.height}
              />
            ) : (
              <Typography
                {...selectedComp.defaultProps}
                width={selectedComp.defaultSize.width}
                height={selectedComp.defaultSize.height}
              />
            ),
          x: Math.max(
            0,
            event.clientX - rect.left - selectedComp.defaultSize.width / 2
          ),
          y: Math.max(
            0,
            event.clientY - rect.top - selectedComp.defaultSize.height / 2
          ),
          width: selectedComp.defaultSize.width,
          height: selectedComp.defaultSize.height,
          props: selectedComp.defaultProps,
        };

        const newPages = pages.map((page) =>
          page.id === activePage
            ? {
                ...page,
                components: [...page.components, newComponent],
              }
            : page
        );
        updatePages(newPages);
      }
    } else if (source === "slide" && draggedComponent) {
      // Mevcut component'i yeniden konumlandırma
      const newX = event.clientX - rect.left - dragOffset.x;
      const newY = event.clientY - rect.top - dragOffset.y;

      const newPages = pages.map((page) =>
        page.id === activePage
          ? {
              ...page,
              components: page.components.map((comp) =>
                comp.id === draggedComponent.id
                  ? { ...comp, x: Math.max(0, newX), y: Math.max(0, newY) }
                  : comp
              ),
            }
          : page
      );
      updatePages(newPages);
    }

    setDraggedComponent(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Component silme
  const handleDeleteComponent = (componentId: string) => {
    const newPages = pages.map((page) =>
      page.id === activePage
        ? {
            ...page,
            components: page.components.filter(
              (comp) => comp.id !== componentId
            ),
          }
        : page
    );
    updatePages(newPages);
    setSelectedComponent(null);
  };

  // Copy component
  const handleCopyComponent = (component: IComponent) => {
    setClipboard({ ...component });
  };

  // Paste component
  const handlePasteComponent = () => {
    if (!clipboard) return;

    const newComponent: IComponent = {
      ...clipboard,
      id: `${clipboard.name}-${Date.now()}`,
      x: clipboard.x + 20,
      y: clipboard.y + 20,
    };

    const newPages = pages.map((page) =>
      page.id === activePage
        ? {
            ...page,
            components: [...page.components, newComponent],
          }
        : page
    );
    updatePages(newPages);
  };

  // Resize başlatma
  const handleResizeStart = (
    event: React.MouseEvent,
    componentId: string,
    handle: string
  ) => {
    event.stopPropagation();
    event.preventDefault();
    setResizing({ componentId, handle });
  };

  // Resize işlemi
  const handleMouseMove = (event: MouseEvent) => {
    if (!resizing || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;

    const newPages = pages.map((page) =>
      page.id === activePage
        ? {
            ...page,
            components: page.components.map((comp) => {
              if (comp.id !== resizing.componentId) return comp;

              let newWidth = comp.width;
              let newHeight = comp.height;
              let newX = comp.x;
              let newY = comp.y;

              switch (resizing.handle) {
                case "se": // Southeast
                  newWidth = Math.max(50, mouseX - comp.x);
                  newHeight = Math.max(30, mouseY - comp.y);
                  break;
                case "sw": // Southwest
                  newWidth = Math.max(50, comp.x + comp.width - mouseX);
                  newHeight = Math.max(30, mouseY - comp.y);
                  newX = Math.min(comp.x, mouseX);
                  break;
                case "ne": // Northeast
                  newWidth = Math.max(50, mouseX - comp.x);
                  newHeight = Math.max(30, comp.y + comp.height - mouseY);
                  newY = Math.min(comp.y, mouseY);
                  break;
                case "nw": // Northwest
                  newWidth = Math.max(50, comp.x + comp.width - mouseX);
                  newHeight = Math.max(30, comp.y + comp.height - mouseY);
                  newX = Math.min(comp.x, mouseX);
                  newY = Math.min(comp.y, mouseY);
                  break;
              }

              // Update component with new dimensions and regenerate with new size
              const updatedComp = {
                ...comp,
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY,
              };
              updatedComp.component =
                comp.name === "Card" ? (
                  <Card {...comp.props} width={newWidth} height={newHeight} />
                ) : (
                  <Typography
                    {...comp.props}
                    width={newWidth}
                    height={newHeight}
                  />
                );

              return updatedComp;
            }),
          }
        : page
    );
    setPages(newPages);
  };

  // Mouse event listeners
  React.useEffect(() => {
    const handleMouseUp = () => {
      if (resizing) {
        saveToHistory(pages, activePage);
        setResizing(null);
      }
    };

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, pages, activePage]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "z":
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case "c":
            if (selectedComponent) {
              event.preventDefault();
              const component = currentPage?.components.find(
                (c) => c.id === selectedComponent
              );
              if (component) handleCopyComponent(component);
            }
            break;
          case "v":
            event.preventDefault();
            handlePasteComponent();
            break;
          case "Delete":
          case "Backspace":
            if (selectedComponent) {
              event.preventDefault();
              handleDeleteComponent(selectedComponent);
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedComponent, historyIndex, clipboard]);

  // Export functionality
  const handleExport = () => {
    const exportData = {
      pages: pages,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presentation.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Component props update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateComponentProps = (componentId: string, newProps: any) => {
    const newPages = pages.map((page) =>
      page.id === activePage
        ? {
            ...page,
            components: page.components.map((comp) =>
              comp.id === componentId
                ? {
                    ...comp,
                    props: { ...comp.props, ...newProps },
                    component:
                      comp.name === "Card" ? (
                        <Card
                          {...comp.props}
                          {...newProps}
                          width={comp.width}
                          height={comp.height}
                        />
                      ) : (
                        <Typography
                          {...comp.props}
                          {...newProps}
                          width={comp.width}
                          height={comp.height}
                        />
                      ),
                  }
                : comp
            ),
          }
        : page
    );
    updatePages(newPages);
  };

  const currentPage = pages.find((page) => page.id === activePage);
  const selectedComp = currentPage?.components.find(
    (c) => c.id === selectedComponent
  );

  return (
    <div className="grid grid-cols-12 gap-4  p-4">
      {/* Sol panel - Sayfalar */}
      <div className="col-span-2 flex flex-col gap-4 max-h-full overflow-auto">
        {/* Toolbar */}
        <div className="sticky top-0 bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex flex-col gap-2">
            <button
              className="bg-red-300 hover:bg-red-400 p-2 rounded-lg transition-colors text-sm"
              onClick={handleAdd}
            >
              + Sayfa
            </button>
            <div className="flex gap-1">
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 p-1 rounded text-xs disabled:opacity-50"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Geri Al (Ctrl+Z)"
              >
                ↶
              </button>
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 p-1 rounded text-xs disabled:opacity-50"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="İleri Al (Ctrl+Shift+Z)"
              >
                ↷
              </button>
            </div>
            <button
              className="bg-green-300 hover:bg-green-400 p-1 rounded text-xs transition-colors"
              onClick={handleExport}
              title="Dışa Aktar"
            >
              📤 Export
            </button>
          </div>
        </div>

        {/* Sayfalar */}
        {pages.map((page) => (
          <div
            key={page.id}
            className={`flex justify-center items-center shadow-md rounded-md min-h-32 cursor-pointer transition-all hover:shadow-lg ${
              activePage === page.id
                ? "shadow-lg border-2 border-blue-500 bg-blue-50"
                : "bg-white"
            }`}
            onDoubleClick={() => handleDoubleClick(page.id)}
          >
            <div className="text-center">
              <div className="font-semibold">{page.title}</div>
              <div className="text-xs text-gray-500">
                {page.components.length} öğe
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orta panel - Editör */}
      <div
        className="col-span-8 flex flex-col gap-2"
        style={{ display: pages.length > 0 && activePage ? "flex" : "none" }}
      >
        {/* Component Library */}
        <div className="flex gap-2 text-center font-bold h-20 overflow-auto p-2 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mr-4 flex items-center">
            Bileşenler:
          </div>
          {availableComponents.map((comp) => (
            <div
              key={comp.name}
              className="min-w-24 h-12 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors"
              draggable
              onDragStart={(event) => handleDragStart(event, comp.name)}
            >
              {comp.name}
            </div>
          ))}
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 relative">
          <div
            ref={canvasRef}
            className="w-full slide-max-height p-2 border-2 border-dashed border-gray-300 rounded-lg bg-white relative overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => setSelectedComponent(null)}
            style={{ minHeight: "500px" }}
          >
            {currentPage?.components.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg pointer-events-none">
                Bileşenleri buraya sürükleyin...
              </div>
            )}

            {currentPage?.components.map((component) => (
              <div
                key={component.id}
                className={`absolute cursor-move group ${
                  selectedComponent === component.id
                    ? "ring-2 ring-blue-400"
                    : ""
                }`}
                style={{
                  left: component.x,
                  top: component.y,
                  width: component.width,
                  height: component.height,
                  zIndex:
                    draggedComponent?.id === component.id
                      ? 1000
                      : selectedComponent === component.id
                      ? 10
                      : 1,
                }}
                draggable={!resizing}
                onDragStart={(event) =>
                  handleComponentDragStart(event, component)
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComponent(component.id);
                }}
              >
                {/* Control buttons */}
                <div
                  className={`absolute -top-8 -right-2 flex gap-1 ${
                    selectedComponent === component.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  } transition-opacity`}
                >
                  <button
                    className="w-6 h-6 bg-blue-500 text-white rounded text-xs flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyComponent(component);
                    }}
                    title="Kopyala (Ctrl+C)"
                  >
                    📋
                  </button>
                  <button
                    className="w-6 h-6 bg-red-500 text-white rounded text-xs flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteComponent(component.id);
                    }}
                    title="Sil (Delete)"
                  >
                    ×
                  </button>
                </div>

                {/* Component */}
                <div className="w-full h-full overflow-hidden rounded border-2 border-transparent group-hover:border-blue-200 transition-colors">
                  {component.component}
                </div>

                {/* Resize handles */}
                {selectedComponent === component.id && (
                  <>
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-full"
                      onMouseDown={(e) =>
                        handleResizeStart(e, component.id, "se")
                      }
                    />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize rounded-full"
                      onMouseDown={(e) =>
                        handleResizeStart(e, component.id, "sw")
                      }
                    />
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize rounded-full"
                      onMouseDown={(e) =>
                        handleResizeStart(e, component.id, "ne")
                      }
                    />
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize rounded-full"
                      onMouseDown={(e) =>
                        handleResizeStart(e, component.id, "nw")
                      }
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ panel - Properties */}
      <div className="col-span-2 bg-gray-50 rounded-lg p-4 max-h-full overflow-auto">
        <h3 className="font-bold mb-4">Özellikler</h3>

        {selectedComp ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tip</label>
              <div className="text-sm text-gray-600">{selectedComp.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pozisyon</label>
              <div className="text-xs text-gray-600">
                X: {Math.round(selectedComp.x)}, Y: {Math.round(selectedComp.y)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Boyut</label>
              <div className="text-xs text-gray-600">
                W: {Math.round(selectedComp.width)}, H:{" "}
                {Math.round(selectedComp.height)}
              </div>
            </div>

            {/* Component specific properties */}
            {selectedComp.name === "Card" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Başlık
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    value={selectedComp.props?.title || ""}
                    onChange={(e) =>
                      updateComponentProps(selectedComp.id, {
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    İçerik
                  </label>
                  <textarea
                    className="w-full p-2 border rounded text-sm"
                    rows={3}
                    value={selectedComp.props?.content || ""}
                    onChange={(e) =>
                      updateComponentProps(selectedComp.id, {
                        content: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {selectedComp.name === "Typography" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Metin
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm"
                    value={selectedComp.props?.text || ""}
                    onChange={(e) =>
                      updateComponentProps(selectedComp.id, {
                        text: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Boyut
                  </label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={selectedComp.props?.size || "lg"}
                    onChange={(e) =>
                      updateComponentProps(selectedComp.id, {
                        size: e.target.value,
                      })
                    }
                  >
                    <option value="sm">Küçük</option>
                    <option value="base">Normal</option>
                    <option value="lg">Büyük</option>
                    <option value="xl">Çok Büyük</option>
                    <option value="2xl">Ekstra Büyük</option>
                  </select>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Düzenlemek için bir bileşen seçin
          </div>
        )}

        {/* Shortcuts */}
        <div className="mt-8 p-3 bg-white rounded border">
          <h4 className="font-medium text-sm mb-2">Kısayollar</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Ctrl+Z: Geri al</div>
            <div>Ctrl+Shift+Z: İleri al</div>
            <div>Ctrl+C: Kopyala</div>
            <div>Ctrl+V: Yapıştır</div>
            <div>Delete: Sil</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
