"use client";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLocale } from "../../i18n/locale-provider";
import en from "./locales/en.json";
import zh from "./locales/zh-CN.json";
import styles from "./modal.module.css";

type Placement = "bottom" | "center";
/** 特殊场景的样式覆盖；普通调用无需重复传入 Design System 默认值。 */
type ModalStyle = CSSProperties & {
  /** 内容面板背景色；默认使用全局 surface token。 */
  "--modal-background"?: string;
  /** 内容面板描边颜色；需要可见描边时，还应设置 border width。 */
  "--modal-border-color"?: string;
  /** 内容面板描边宽度，使用 CSS 长度（如 1px）；默认 0px。 */
  "--modal-border-width"?: string;
  /** 内容面板圆角，使用 CSS 长度；bottom 仅上方圆角，center 四角圆角。 */
  "--modal-radius"?: string;
};

export type ModalProps = Readonly<{
  /** 受控显示状态。false 时不渲染弹窗内容；状态由调用方持有。 */
  open: boolean;
  /**
   * 关闭请求回调：关闭按钮、允许的 ESC / backdrop 点击均传 false。
   * 调用方需更新 open 才会实际关闭；Modal 不维护另一份 open state。
   */
  onOpenChange: (open: boolean) => void;
  /** 业务内容插槽；Shared Modal 不解析其中的钱包、数据或操作语义。 */
  children: ReactNode;
  /** 小于 500px 的视口布局，默认 bottom；可指定 center。 */
  mobilePlacement?: Placement;
  /** 500px 及以上的视口布局，默认 center；可指定 bottom。分界由 Modal CSS 维护。 */
  desktopPlacement?: Placement;
  /** 点击全屏空白遮罩是否请求关闭。不传或传 true 时关闭；仅 false 禁止。点击内容不会触发。 */
  closeOnBackdrop?: boolean;
  /** ESC 是否请求关闭，默认 true；禁用时请提供其他明确的退出方式。 */
  closeOnEscape?: boolean;
  /** 默认关闭按钮的可访问名称；省略时使用 Shared 本地化文案 Close。 */
  closeLabel?: string;
  /** 高级场景覆盖关闭图标；省略时使用 Design System 的 24px 原始关闭图标。 */
  closeIcon?: ReactNode;
  /** 应用于 dialog 外层，用于特殊样式或 CSS variable 覆盖，不替换默认 class。 */
  className?: string;
  /** 行内 CSS / 语义变量覆盖；背景、描边和圆角作用于内容面板。 */
  style?: ModalStyle;
}> &
  (
    | {
        /** 默认标题栏：标题居中、关闭按钮居右；省略时为 default。 */
        header?: "default";
        /** 标题栏内容，并通过 aria-labelledby 为 dialog 提供可访问名称。 */
        title: ReactNode;
        /** 默认标题栏模式使用 title 关联命名，此参数不参与渲染。 */
        ariaLabel?: string;
      }
    | {
        /** 不渲染标题栏及默认关闭按钮，由 children 提供自定义内容。 */
        header: "none";
        /** 无标题栏模式不接受 title，避免产生未展示的标题。 */
        title?: never;
        /** 无标题栏时必填的 dialog 可访问名称，不会作为可见正文展示。 */
        ariaLabel: string;
      }
  );
const resources = { en, "zh-CN": zh };

/**
 * Design System 弹层壳，默认视觉提取自已验收的 Wallet Sheet。
 * 负责原生 dialog、焦点隔离/恢复、scroll lock 与关闭请求；业务内容及 open 由调用方持有。
 *
 * @example
 * <Modal open={open} onOpenChange={setOpen} title="标题">
 *   <BusinessContent />
 * </Modal>
 *
 * @example
 * <Modal open={open} onOpenChange={setOpen} header="none" ariaLabel="自定义弹窗">
 *   <CustomContent />
 * </Modal>
 */
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  header = "default",
  ariaLabel,
  mobilePlacement = "bottom",
  desktopPlacement = "center",
  closeOnBackdrop = true,
  closeOnEscape = true,
  closeLabel,
  closeIcon,
  className,
  style,
}: ModalProps) {
  const text = resources[useLocale()];
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (node.open) node.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;

  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog}${className ? ` ${className}` : ""}`}
      style={style}
      data-mobile-placement={mobilePlacement}
      data-desktop-placement={desktopPlacement}
      aria-labelledby={header === "default" ? titleId : undefined}
      aria-label={header === "none" ? ariaLabel : undefined}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (closeOnEscape) onOpenChange(false);
      }}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (
          !closeOnBackdrop ||
          !backdropPress.current ||
          event.target !== event.currentTarget
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom
        )
          onOpenChange(false);
      }}
    >
      <section className={styles.panel} data-modal-panel>
        {header === "default" && (
          <div className={styles.header} data-modal-header>
            <h2 id={titleId}>{title}</h2>
            <button
              type="button"
              className={styles.close}
              aria-label={closeLabel ?? text.close}
              onClick={() => onOpenChange(false)}
            >
              {closeIcon ?? (
                <>
                  {/* Exact canonical Wallet close asset, promoted with the default shell. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ui/modal/close.svg"
                    width={24}
                    height={24}
                    alt=""
                  />
                </>
              )}
            </button>
          </div>
        )}
        {children}
      </section>
    </dialog>
  );
}
