type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function PaginationControls({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn btn-sm">Prev</button>
      {pages.map((p) => (
        <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn btn-sm">Next</button>
    </div>
  );
}
