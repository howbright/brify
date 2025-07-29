"use client";

import { useState } from "react";
import SummaryEditor from "./SummaryEditor";
import SummaryViewer from "./SummaryViewer";

interface Props {
  initialText: string;
  onOpenFullView?: () => void;
  onSaveText?: (text: string) => void; // 저장 로직 추가 가능
  scrollToComment: () => void;
  scrollToTop: () => void;
  scrollToDiagram: () => void;
  fullMode:boolean
}

export default function SummaryContent({
  initialText,
  onOpenFullView,
  onSaveText,
  scrollToComment,
  scrollToTop,
  scrollToDiagram,
  fullMode
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState(initialText);

  return (
    <>
      {isEditing ? (
        <SummaryEditor
          initialContent={editedMarkdown}
          onCancel={() => setIsEditing(false)}
          onSave={(markdown) => {
            setIsEditing(false);
            setEditedMarkdown(markdown);
            if (onSaveText) onSaveText(markdown);
          }}
        />
      ) : (
        <SummaryViewer
          text={editedMarkdown}
          onEdit={() => setIsEditing(true)}
          scrollToComment={scrollToComment}
          scrollToTop={scrollToTop}
          scrollToDiagram={scrollToDiagram}
          onFullView={onOpenFullView}
          fullMode={fullMode}
        />
      )}
    </>
  );
}
