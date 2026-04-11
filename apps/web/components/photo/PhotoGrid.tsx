"use client";

import { useEffect, useMemo, useState } from "react";

import { Photo } from "@/lib/types";
import { PhotoCard } from "./PhotoCard";

function getColumnCount(width: number) {
  if (width >= 2200) return 8;
  if (width >= 1800) return 7;
  if (width >= 1536) return 6;
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

export function PhotoGrid({ items }: { items: Photo[] }) {
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    function updateColumns() {
      setColumnCount(getColumnCount(window.innerWidth));
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);

    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const columns = useMemo(() => {
    const nextColumns: Array<Array<{ photo: Photo; index: number }>> = Array.from(
      { length: columnCount },
      () => []
    );

    items.forEach((photo, index) => {
      nextColumns[index % columnCount].push({ photo, index });
    });

    return nextColumns;
  }, [columnCount, items]);

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-col gap-4">
          {column.map(({ photo, index }) => (
            <PhotoCard
              key={photo._id}
              photo={photo}
              priority={index < 6}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
