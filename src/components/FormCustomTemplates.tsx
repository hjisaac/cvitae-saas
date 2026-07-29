"use client";

import React, { useState } from "react";
import { 
  FieldTemplateProps, 
  ObjectFieldTemplateProps, 
  ArrayFieldTemplateProps, 
  WidgetProps 
} from "@rjsf/utils";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  AlignLeft,
  Sparkles,
  Layers,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  Languages as LangIcon,
  UserCheck,
  FileText
} from "lucide-react";

// Helper icon picker by section name
function getSectionIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("work") || t.includes("experience")) return <Briefcase className="w-4 h-4 text-[var(--accent)]" />;
  if (t.includes("education")) return <GraduationCap className="w-4 h-4 text-[var(--accent)]" />;
  if (t.includes("project")) return <FolderGit2 className="w-4 h-4 text-[var(--accent)]" />;
  if (t.includes("skill") || t.includes("technolog")) return <Wrench className="w-4 h-4 text-[var(--accent)]" />;
  if (t.includes("language")) return <LangIcon className="w-4 h-4 text-[var(--accent)]" />;
  if (t.includes("referee")) return <UserCheck className="w-4 h-4 text-[var(--accent)]" />;
  if (t.includes("summary")) return <AlignLeft className="w-4 h-4 text-[var(--accent)]" />;
  return <Layers className="w-4 h-4 text-[var(--accent)]" />;
}

// Custom Field Wrapper Template
export function CustomFieldTemplate(props: FieldTemplateProps) {
  const { id, classNames, label, help, required, description, errors, children, displayLabel } = props;

  return (
    <div className={`my-3.5 transition-all duration-200 ${classNames}`} id={id}>
      {displayLabel && label && (
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-gray-700 tracking-wide mb-1.5 uppercase flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[var(--accent)] text-sm ml-0.5">*</span>}
        </label>
      )}
      {description && <div className="text-xs text-gray-400 mb-2 leading-relaxed">{description}</div>}
      <div className="relative group">{children}</div>
      {errors}
      {help}
    </div>
  );
}

// Custom Text Input Widget
export function CustomTextWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, onBlur, onFocus, placeholder } = props;

  return (
    <input
      id={id}
      type="text"
      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-sans text-gray-800 placeholder-gray-400 transition-all duration-200 shadow-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-gray-300 disabled:bg-gray-50 disabled:opacity-60"
      value={value || ""}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      placeholder={placeholder || "Enter value..."}
      onChange={(e) => onChange(e.target.value === "" ? props.options.emptyValue : e.target.value)}
      onBlur={(e) => onBlur && onBlur(id, e.target.value)}
      onFocus={(e) => onFocus && onFocus(id, e.target.value)}
    />
  );
}

// Custom Textarea Widget with Word Count
export function CustomTextareaWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, onBlur, onFocus, placeholder } = props;
  const valStr = value || "";
  const wordCount = valStr.trim() ? valStr.trim().split(/\s+/).length : 0;
  const charCount = valStr.length;

  return (
    <div className="relative">
      <textarea
        id={id}
        rows={4}
        className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-sans text-gray-800 placeholder-gray-400 transition-all duration-200 shadow-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-gray-300 leading-relaxed resize-y disabled:bg-gray-50 disabled:opacity-60"
        value={valStr}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        placeholder={placeholder || "Write content here..."}
        onChange={(e) => onChange(e.target.value === "" ? props.options.emptyValue : e.target.value)}
        onBlur={(e) => onBlur && onBlur(id, e.target.value)}
        onFocus={(e) => onFocus && onFocus(id, e.target.value)}
      />
      <div className="flex justify-end gap-3 mt-1 px-1 text-[11px] text-gray-400 font-mono">
        <span>{wordCount} words</span>
        <span>•</span>
        <span>{charCount} chars</span>
      </div>
    </div>
  );
}

// Custom Object Field Template (Collapsible Section Card)
export function CustomObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { title, description, properties } = props;
  const [collapsed, setCollapsed] = useState(false);
  const isRoot = !title || (props as any).idSchema?.$id === "root";

  if (isRoot) {
    return <div className="space-y-6">{properties.map((element) => element.content)}</div>;
  }

  return (
    <div className="my-5 bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      {title && (
        <div 
          onClick={() => setCollapsed(!collapsed)}
          className="px-5 py-4 bg-[#fcfcfb] border-b border-[var(--border)] flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {getSectionIcon(title)}
            <h3 className="font-semibold text-sm text-gray-800 tracking-tight">{title}</h3>
            {description && <span className="text-xs text-gray-400 font-normal hidden sm:inline">— {description}</span>}
          </div>
          <button 
            type="button" 
            className="p-1 rounded-lg hover:bg-gray-200/60 text-gray-500 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}

      {!collapsed && (
        <div className="p-5 space-y-4 bg-white">
          {properties.map((element) => (
            <div key={element.name}>{element.content}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom Array Field Template (Item Lists & Entries)
export function CustomArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { title, items, canAdd, onAddClick, disabled, readonly } = props;

  return (
    <div className="my-5 bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
      {title && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            {title}
            <span className="text-xs font-mono font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </span>
          </h4>

          {canAdd && (
            <button
              type="button"
              disabled={disabled || readonly}
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--accent)] bg-orange-50 border border-orange-200/60 rounded-xl hover:bg-orange-100/80 transition-all duration-200 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Entry
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {items.map((element: any, idx: number) => (
          <div 
            key={element.key || idx} 
            className="p-4 bg-[#fbfbfa] border border-gray-200/80 rounded-xl space-y-3 relative group transition-all duration-200 hover:border-gray-300 hover:bg-white hover:shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
              <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                Item #{idx + 1}
              </span>

              <div className="flex items-center gap-1">
                {element.hasMoveUp && (
                  <button
                    type="button"
                    onClick={element.onReorderClick ? element.onReorderClick(idx, idx - 1) : undefined}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {element.hasMoveDown && (
                  <button
                    type="button"
                    onClick={element.onReorderClick ? element.onReorderClick(idx, idx + 1) : undefined}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {element.hasRemove && (
                  <button
                    type="button"
                    onClick={element.onDropIndexClick ? element.onDropIndexClick(idx) : undefined}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1"
                    title="Remove Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>{element.children}</div>
          </div>
        ))}
      </div>

      {canAdd && items.length === 0 && (
        <div 
          onClick={onAddClick}
          className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[var(--accent)] hover:bg-orange-50/30 transition-all duration-200 group"
        >
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-[var(--accent)] mx-auto mb-1 transition-colors" />
          <div className="text-xs font-medium text-gray-600 group-hover:text-[var(--accent)]">Click to add first item</div>
        </div>
      )}
    </div>
  );
}

export const customFormTemplates = {
  FieldTemplate: CustomFieldTemplate,
  ObjectFieldTemplate: CustomObjectFieldTemplate,
  ArrayFieldTemplate: CustomArrayFieldTemplate,
};

export const customFormWidgets = {
  TextWidget: CustomTextWidget,
  TextareaWidget: CustomTextareaWidget,
  textarea: CustomTextareaWidget,
};
