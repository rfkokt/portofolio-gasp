"use client";

import {
  EditorRoot,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorContent,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
  useEditor,
  StarterKit,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  TextStyle,
  Color,
  TaskList,
  TaskItem,
  CodeBlockLowlight,
  Placeholder,
  HighlightExtension,
  Command,
} from "novel";
import { handleCommandNavigation } from "novel";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { common, createLowlight } from "lowlight";
import TurndownService from "turndown";
import { marked } from "marked";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  TextQuote,
  Code2,
  CheckSquare,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  Palette,
  ChevronRight,
  Minus,
  GripVertical,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { improveText } from "@/actions/ai-generate";

const lowlight = createLowlight(common);

interface NovelEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const TEXT_COLORS = [
  { name: "Default", color: null },
  { name: "Gray", color: "#6B7280" },
  { name: "Brown", color: "#92400E" },
  { name: "Orange", color: "#F59E0B" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Green", color: "#22C55E" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Purple", color: "#8B5CF6" },
  { name: "Pink", color: "#EC4899" },
  { name: "Red", color: "#EF4444" },
];

const HIGHLIGHT_COLORS = [
  { name: "Default", color: null },
  { name: "Gray", color: "rgba(107, 114, 128, 0.2)" },
  { name: "Brown", color: "rgba(146, 64, 14, 0.2)" },
  { name: "Orange", color: "rgba(245, 158, 11, 0.2)" },
  { name: "Yellow", color: "rgba(234, 179, 8, 0.2)" },
  { name: "Green", color: "rgba(34, 197, 94, 0.2)" },
  { name: "Blue", color: "rgba(59, 130, 246, 0.2)" },
  { name: "Purple", color: "rgba(139, 92, 246, 0.2)" },
  { name: "Pink", color: "rgba(236, 72, 153, 0.2)" },
  { name: "Red", color: "rgba(239, 68, 68, 0.2)" },
];

const BLOCK_TYPES = [
  { name: "Text", value: "paragraph", icon: <Type className="w-4 h-4" /> },
  { name: "Heading 1", value: "heading1", icon: <Heading1 className="w-4 h-4" /> },
  { name: "Heading 2", value: "heading2", icon: <Heading2 className="w-4 h-4" /> },
  { name: "Heading 3", value: "heading3", icon: <Heading3 className="w-4 h-4" /> },
  { name: "Bullet List", value: "bulletList", icon: <List className="w-4 h-4" /> },
  { name: "Numbered List", value: "orderedList", icon: <ListOrdered className="w-4 h-4" /> },
  { name: "To-do List", value: "taskList", icon: <CheckSquare className="w-4 h-4" /> },
  { name: "Quote", value: "blockquote", icon: <TextQuote className="w-4 h-4" /> },
  { name: "Code Block", value: "codeBlock", icon: <Code2 className="w-4 h-4" /> },
];

const suggestionItems = [
  { title: "Text", description: "Plain text", icon: <Type className="w-5 h-5" /> },
  { title: "Heading 1", description: "Big heading", icon: <Heading1 className="w-5 h-5" /> },
  { title: "Heading 2", description: "Medium heading", icon: <Heading2 className="w-5 h-5" /> },
  { title: "Heading 3", description: "Small heading", icon: <Heading3 className="w-5 h-5" /> },
  { title: "Bullet List", description: "Bullet list", icon: <List className="w-5 h-5" /> },
  { title: "Numbered List", description: "Numbered list", icon: <ListOrdered className="w-5 h-5" /> },
  { title: "Quote", description: "Quote block", icon: <TextQuote className="w-5 h-5" /> },
  { title: "Code Block", description: "Code block", icon: <Code2 className="w-5 h-5" /> },
  { title: "To-do List", description: "Task list", icon: <CheckSquare className="w-5 h-5" /> },
  { title: "Divider", description: "Separator line", icon: <Minus className="w-5 h-5" /> },
  { title: "Image", description: "Embed image", icon: <ImageIcon className="w-5 h-5" /> },
];

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Command,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") return `Heading ${node.attrs.level}`;
      return "Type '/' for commands...";
    },
  }),
  TiptapImage.configure({ HTMLAttributes: { class: "rounded-lg border border-border max-w-full" } }),
  TiptapLink.configure({ HTMLAttributes: { class: "text-blue-500 underline cursor-pointer" } }),
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension.configure({ multicolor: true }),
  TaskList.configure({ HTMLAttributes: { class: "not-prose pl-2" } }),
  TaskItem.configure({ nested: true }),
  CodeBlockLowlight.configure({ lowlight }),
];

export function NovelEditor({ value, onChange, onImageUpload }: NovelEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full" data-novel-editor ref={editorRef}>
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          extensions={extensions as any}
          className="relative min-h-[500px] w-full border border-border bg-background rounded-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => {
              const items = event.clipboardData?.items;
              if (!items || !onImageUpload) return false;
              for (const item of items) {
                if (item.type.startsWith("image/")) {
                  event.preventDefault();
                  const file = item.getAsFile();
                  if (!file) continue;
                  onImageUpload(file).then((url) => {
                    if (url) {
                      const { state, dispatch } = view;
                      const node = state.schema.nodes.image.create({ src: url });
                      dispatch(state.tr.replaceSelectionWith(node));
                    }
                  });
                  return true;
                }
              }
              return false;
            },
            handleDrop: (view, event) => {
              const files = event.dataTransfer?.files;
              if (!files || !onImageUpload) return false;
              for (const file of files) {
                if (file.type.startsWith("image/")) {
                  event.preventDefault();
                  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  onImageUpload(file).then((url) => {
                    if (url && pos) {
                      const { state, dispatch } = view;
                      const node = state.schema.nodes.image.create({ src: url });
                      dispatch(state.tr.insert(pos.pos, node));
                    }
                  });
                  return true;
                }
              }
              return false;
            },
            attributes: {
              class: "prose prose-lg dark:prose-invert prose-headings:font-bold font-default focus:outline-none max-w-full pl-20 pr-8 py-8 min-h-[400px]",
            },
          }}
          onCreate={({ editor }) => {
            if (value) {
              // Configure marked for proper parsing
              marked.setOptions({
                breaks: true, // Treat single \n as <br>
                gfm: true,    // Enable GitHub Flavored Markdown
              });
              
              // Convert markdown to HTML for display
              const htmlContent = marked.parse(value) as string;
              console.log('[NovelEditor] Markdown input:', value.substring(0, 200));
              console.log('[NovelEditor] HTML output:', htmlContent.substring(0, 200));
              editor.commands.setContent(htmlContent);
            }
          }}
          onUpdate={({ editor }) => {
            // Convert HTML to markdown for storage
            const turndownService = new TurndownService({
              headingStyle: 'atx',
              codeBlockStyle: 'fenced',
            });
            const markdown = turndownService.turndown(editor.getHTML());
            onChange(markdown);
          }}
        >
          {/* Block Handle - Inside EditorContent so useEditor works */}
          <BlockHandle editorRef={editorRef} />

          {/* Slash Command Menu */}
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-border bg-background px-1 py-2 shadow-md">
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={({ editor, range }) => {
                    switch (item.title) {
                      case "Text": editor.chain().focus().deleteRange(range).setParagraph().run(); break;
                      case "Heading 1": editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(); break;
                      case "Heading 2": editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(); break;
                      case "Heading 3": editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(); break;
                      case "Bullet List": editor.chain().focus().deleteRange(range).toggleBulletList().run(); break;
                      case "Numbered List": editor.chain().focus().deleteRange(range).toggleOrderedList().run(); break;
                      case "Quote": editor.chain().focus().deleteRange(range).toggleBlockquote().run(); break;
                      case "Code Block": editor.chain().focus().deleteRange(range).toggleCodeBlock().run(); break;
                      case "To-do List": editor.chain().focus().deleteRange(range).toggleTaskList().run(); break;
                      case "Divider": editor.chain().focus().deleteRange(range).setHorizontalRule().run(); break;
                      case "Image":
                        editor.chain().focus().deleteRange(range).run();
                        const url = window.prompt("Enter image URL:");
                        if (url) editor.chain().focus().setImage({ src: url }).run();
                        break;
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-muted cursor-pointer"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">{item.icon}</div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          {/* Bubble Menu */}
          <EditorBubble tippyOptions={{ placement: "top-start", offset: [0, 10] }} className="flex w-fit items-center gap-1 rounded-md border border-border bg-card text-card-foreground p-1 shadow-xl">
            <BubbleNodeSelector />
            <div className="w-px h-4 bg-border" />
            <BubbleButton command="toggleBold" icon={<Bold className="w-4 h-4" />} />
            <BubbleButton command="toggleItalic" icon={<Italic className="w-4 h-4" />} />
            <BubbleButton command="toggleUnderline" icon={<Underline className="w-4 h-4" />} />
            <BubbleButton command="toggleStrike" icon={<Strikethrough className="w-4 h-4" />} />
            <BubbleButton command="toggleCode" icon={<Code className="w-4 h-4" />} />
            <div className="w-px h-4 bg-border" />
            <BubbleLinkButton />
            <BubbleColorButton />
            <div className="w-px h-4 bg-border" />
            <BubbleAIButton />
          </EditorBubble>
        </EditorContent>
      </EditorRoot>

      <p className="mt-2 text-xs text-muted-foreground">
        Hover blocks for menu • Type <code className="bg-muted px-1 rounded">/</code> for commands • Select text for formatting
      </p>
    </div>
  );
}

// Block Handle Component - now inside EditorRoot context
function BlockHandle({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const { editor } = useEditor();
  const [blockMenuPos, setBlockMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!editorRef.current || showBlockMenu) return;
      
      const target = e.target as HTMLElement;
      const proseMirror = editorRef.current.querySelector('.ProseMirror') as HTMLElement;
      if (!proseMirror) return;

      const blockElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'HR', 'DIV', 'LI'];
      let blockEl = target;
      
      while (blockEl && blockEl !== proseMirror) {
        if (blockElements.includes(blockEl.tagName) && blockEl.parentElement === proseMirror) break;
        blockEl = blockEl.parentElement as HTMLElement;
      }

      if (blockEl && blockEl !== proseMirror && blockEl.parentElement === proseMirror) {
        const rect = blockEl.getBoundingClientRect();
        const proseMirrorRect = proseMirror.getBoundingClientRect();
        
        setBlockMenuPos({
          x: proseMirrorRect.left + 12, // Position inside editor padding area
          y: rect.top + rect.height / 2 - 14,
        });
      }
    };

    const handleMouseLeave = () => {
      if (!showBlockMenu) {
        setTimeout(() => {
          if (!handleRef.current?.matches(':hover')) {
            setBlockMenuPos(null);
          }
        }, 150);
      }
    };

    const editorEl = editorRef.current;
    editorEl.addEventListener('mousemove', handleMouseMove);
    editorEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorEl.removeEventListener('mousemove', handleMouseMove);
      editorEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editorRef, showBlockMenu]);

  const closeAllMenus = () => {
    setShowBlockMenu(false);
    setShowAddMenu(false);
    setShowTurnInto(false);
    setShowColors(false);
    setBlockMenuPos(null);
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddMenu(!showAddMenu);
    setShowBlockMenu(false);
    setShowTurnInto(false);
    setShowColors(false);
  };

  const addBlock = (type: string) => {
    if (!editor) return;
    // Move to end of current block and insert new block
    const { state } = editor;
    const { $from } = state.selection;
    const endOfBlock = $from.end();
    
    editor.chain().focus().setTextSelection(endOfBlock).run();
    
    switch (type) {
      case "paragraph": editor.chain().focus().splitBlock().setParagraph().run(); break;
      case "heading1": editor.chain().focus().splitBlock().setHeading({ level: 1 }).run(); break;
      case "heading2": editor.chain().focus().splitBlock().setHeading({ level: 2 }).run(); break;
      case "heading3": editor.chain().focus().splitBlock().setHeading({ level: 3 }).run(); break;
      case "bulletList": editor.chain().focus().splitBlock().toggleBulletList().run(); break;
      case "orderedList": editor.chain().focus().splitBlock().toggleOrderedList().run(); break;
      case "taskList": editor.chain().focus().splitBlock().toggleTaskList().run(); break;
      case "blockquote": editor.chain().focus().splitBlock().toggleBlockquote().run(); break;
      case "codeBlock": editor.chain().focus().splitBlock().toggleCodeBlock().run(); break;
      case "divider": editor.chain().focus().splitBlock().setHorizontalRule().run(); break;
    }
    closeAllMenus();
  };

  const turnInto = (type: string) => {
    if (!editor) return;
    switch (type) {
      case "paragraph": editor.chain().focus().clearNodes().setParagraph().run(); break;
      case "heading1": editor.chain().focus().clearNodes().setHeading({ level: 1 }).run(); break;
      case "heading2": editor.chain().focus().clearNodes().setHeading({ level: 2 }).run(); break;
      case "heading3": editor.chain().focus().clearNodes().setHeading({ level: 3 }).run(); break;
      case "bulletList": editor.chain().focus().clearNodes().toggleBulletList().run(); break;
      case "orderedList": editor.chain().focus().clearNodes().toggleOrderedList().run(); break;
      case "taskList": editor.chain().focus().clearNodes().toggleTaskList().run(); break;
      case "blockquote": editor.chain().focus().clearNodes().toggleBlockquote().run(); break;
      case "codeBlock": editor.chain().focus().clearNodes().toggleCodeBlock().run(); break;
    }
    closeAllMenus();
  };

  if (!editor || !blockMenuPos) return null;

  return (
    <div
      ref={handleRef}
      className="fixed z-[100] flex items-center gap-0.5 bg-background rounded border border-border shadow-sm"
      style={{ left: blockMenuPos.x, top: blockMenuPos.y }}
    >
      {/* Plus button - triggers slash command */}
      <button
        className="p-1.5 hover:bg-muted rounded-l transition-colors text-muted-foreground hover:text-foreground"
        title="Add block"
        onClick={handlePlusClick}
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        className="p-1.5 hover:bg-muted rounded-r transition-colors text-muted-foreground hover:text-foreground"
        title="Click for options"
        onClick={(e) => {
          e.stopPropagation();
          setShowBlockMenu(!showBlockMenu);
          setShowAddMenu(false);
          setShowTurnInto(false);
          setShowColors(false);
        }}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Add Block Menu */}
      {showAddMenu && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-background border border-border rounded-lg shadow-xl py-1 z-[100]">
          <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">Add block</p>
          {BLOCK_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => addBlock(type.value)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted text-left"
            >
              {type.icon}
              <span>{type.name}</span>
            </button>
          ))}
          <button
            onClick={() => addBlock("divider")}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted text-left"
          >
            <Minus className="w-4 h-4" />
            <span>Divider</span>
          </button>
        </div>
      )}
      
      {/* Context Menu */}
      {showBlockMenu && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-background border border-border rounded-lg shadow-xl py-1 z-[100]">
          {/* Turn Into */}
          <div className="relative">
            <button
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted text-left"
              onClick={() => { setShowTurnInto(!showTurnInto); setShowColors(false); }}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Turn into</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {showTurnInto && (
              <div className="absolute left-full top-0 ml-1 w-44 bg-background border border-border rounded-lg shadow-xl py-1 z-[101]">
                {BLOCK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => turnInto(type.value)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted text-left"
                  >
                    {type.icon}
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color */}
          <div className="relative">
            <button
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted text-left"
              onClick={() => { setShowColors(!showColors); setShowTurnInto(false); }}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Color</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {showColors && (
              <div className="absolute left-full top-0 ml-1 w-44 bg-background border border-border rounded-lg shadow-xl p-3 z-[101]">
                <p className="text-xs font-medium text-muted-foreground mb-2">Text</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        c.color ? editor.chain().focus().setColor(c.color).run() : editor.chain().focus().unsetColor().run();
                        closeAllMenus();
                      }}
                      className="w-5 h-5 rounded border border-border hover:border-foreground"
                      style={{ backgroundColor: c.color || "transparent" }}
                      title={c.name}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Background</p>
                <div className="flex flex-wrap gap-1">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        c.color ? editor.chain().focus().setHighlight({ color: c.color }).run() : editor.chain().focus().unsetHighlight().run();
                        closeAllMenus();
                      }}
                      className="w-5 h-5 rounded border border-border hover:border-foreground"
                      style={{ backgroundColor: c.color || "transparent" }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border my-1" />

          {/* Duplicate */}
          <button
            onClick={() => {
              const { state } = editor;
              const { selection } = state;
              const { $from } = selection;
              const node = $from.node($from.depth);
              if (node) editor.commands.insertContentAt(selection.to, node.toJSON());
              closeAllMenus();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate</span>
          </button>

          {/* Reset formatting */}
          <button
            onClick={() => {
              editor.chain().focus().clearNodes().unsetAllMarks().run();
              closeAllMenus();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset formatting</span>
          </button>

          <div className="border-t border-border my-1" />

          {/* Delete */}
          <button
            onClick={() => {
              editor.commands.deleteNode(editor.state.selection.$from.parent.type);
              closeAllMenus();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Bubble menu components
function BubbleNodeSelector() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  const getCurrentNodeName = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    if (editor.isActive("bulletList")) return "List";
    if (editor.isActive("orderedList")) return "Num";
    if (editor.isActive("blockquote")) return "Quote";
    if (editor.isActive("codeBlock")) return "Code";
    return "Text";
  };

  const turnInto = (type: string) => {
    switch (type) {
      case "paragraph": editor.chain().focus().clearNodes().setParagraph().run(); break;
      case "heading1": editor.chain().focus().clearNodes().setHeading({ level: 1 }).run(); break;
      case "heading2": editor.chain().focus().clearNodes().setHeading({ level: 2 }).run(); break;
      case "heading3": editor.chain().focus().clearNodes().setHeading({ level: 3 }).run(); break;
      case "bulletList": editor.chain().focus().clearNodes().toggleBulletList().run(); break;
      case "orderedList": editor.chain().focus().clearNodes().toggleOrderedList().run(); break;
      case "blockquote": editor.chain().focus().clearNodes().toggleBlockquote().run(); break;
      case "codeBlock": editor.chain().focus().clearNodes().toggleCodeBlock().run(); break;
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-muted rounded">
        <span className="font-medium">{getCurrentNodeName()}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-background border border-border rounded-md shadow-lg z-50 py-1">
          {BLOCK_TYPES.map((type) => (
            <button key={type.value} onClick={() => turnInto(type.value)} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted text-left">
              {type.icon}<span>{type.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BubbleColorButton() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Colors">
        <Palette className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50 p-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Text</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {TEXT_COLORS.map((c) => (
              <button key={c.name} onClick={() => { c.color ? editor.chain().focus().setColor(c.color).run() : editor.chain().focus().unsetColor().run(); setOpen(false); }} className="w-5 h-5 rounded border border-border hover:border-foreground" style={{ backgroundColor: c.color || "transparent" }} title={c.name} />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Background</p>
          <div className="flex flex-wrap gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button key={c.name} onClick={() => { c.color ? editor.chain().focus().setHighlight({ color: c.color }).run() : editor.chain().focus().unsetHighlight().run(); setOpen(false); }} className="w-5 h-5 rounded border border-border hover:border-foreground" style={{ backgroundColor: c.color || "transparent" }} title={c.name} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BubbleLinkButton() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  if (!editor) return null;

  const handleOpen = () => {
    setUrl(editor.getAttributes("link").href || "");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setOpen(false);
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen} 
        className={`p-1.5 rounded hover:bg-muted ${editor.isActive("link") ? "bg-muted text-foreground" : "text-muted-foreground"}`} 
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      
      {open && (
        <form onSubmit={handleSubmit} className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-xl p-3 z-50">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              data-submit="true"
              className="flex-1 px-3 py-1.5 text-sm rounded-md"
            >
              Apply
            </button>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-sm text-destructive border border-destructive/50 rounded-md hover:bg-destructive/10"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function BubbleButton({ command, icon }: { command: string; icon: React.ReactNode }) {
  const { editor } = useEditor();
  if (!editor) return null;
  const isActive = editor.isActive(command.replace("toggle", "").toLowerCase());

  return (
    <EditorBubbleItem onSelect={(editor) => { (editor.chain().focus() as any)[command]().run(); }}>
      <button type="button" className={`p-1.5 rounded hover:bg-muted ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`}>{icon}</button>
    </EditorBubbleItem>
  );
}

function BubbleAIButton() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!editor) return null;

  const handleImprove = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    
    if (!selectedText.trim()) {
      setError("Please select some text first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await improveText(selectedText, instructions);
      
      if (result.success && result.data) {
        // Convert markdown to HTML before inserting
        const htmlContent = marked.parse(result.data) as string;
        editor.chain().focus().deleteSelection().insertContent(htmlContent).run();
        setOpen(false);
        setInstructions("");
      } else {
        setError(result.error || "Failed to improve text");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`p-1.5 rounded hover:bg-muted ${open ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        title="Improve with AI"
      >
        <Sparkles className="w-4 h-4" />
      </button>
      
      {open && (
        <form 
          onSubmit={handleImprove}
          className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-50 w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Improve with AI</span>
          </div>
          
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="How should I improve this? (e.g., 'make it more formal', 'simplify', 'add more detail')"
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-none"
            rows={3}
            disabled={loading}
          />
          
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
          
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-sm border-2 border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 rounded-md hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Improve
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              className="px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
