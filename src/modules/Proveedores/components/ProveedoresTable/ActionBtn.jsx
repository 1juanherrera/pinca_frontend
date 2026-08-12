export const ActionBtn = ({ onClick, icon: Icon, title, danger }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border transition-colors ${
      danger
        ? 'border-border-base text-content-muted hover:bg-semantic-danger hover:text-white hover:border-semantic-danger'
        : 'border-border-base text-content-muted hover:bg-content-primary hover:text-content-inverse hover:border-content-primary'
    }`}
    title={title}
  >
    <Icon size={12} />
  </button>
);

export default ActionBtn;
