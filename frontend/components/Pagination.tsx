import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  basePath: string;
  queryParams?: Record<string, string>;
  hash?: string;
}

export default function Pagination({ currentPage, lastPage, basePath, queryParams = {}, hash }: PaginationProps) {
  // Always show first, last, and pages around current
  const maxPagesToShow = 5;
  const pages: (number | string)[] = [];

  if (lastPage <= 1) return null;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(lastPage, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < lastPage) {
    if (endPage < lastPage - 1) pages.push('...');
    pages.push(lastPage);
  }

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(queryParams);
    params.set('page', page.toString());
    const hashStr = hash ? `#${hash}` : '';
    return `${basePath}?${params.toString()}${hashStr}`;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8">
      {currentPage > 1 && (
        <Link 
          href={buildUrl(currentPage - 1)}
          className="px-3 py-1 md:px-4 md:py-2 text-sm bg-[#141519] text-[#a0a0a0] rounded hover:bg-[#ff4dd2] hover:text-white transition-colors"
        >
          Prev
        </Link>
      )}

      {pages.map((p, i) => (
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="text-[#a0a0a0] px-2">...</span>
        ) : (
          <Link
            key={`page-${p}`}
            href={buildUrl(p as number)}
            className={`px-3 py-1 md:px-4 md:py-2 text-sm rounded transition-colors ${
              p === currentPage 
                ? 'bg-[#ff4dd2] text-white shadow-[0_0_10px_rgba(255, 77, 210,0.5)]' 
                : 'bg-[#141519] text-[#a0a0a0] hover:bg-[#ff4dd2]/50 hover:text-white'
            }`}
          >
            {p}
          </Link>
        )
      ))}

      {currentPage < lastPage && (
        <Link 
          href={buildUrl(currentPage + 1)}
          className="px-3 py-1 md:px-4 md:py-2 text-sm bg-[#141519] text-[#a0a0a0] rounded hover:bg-[#ff4dd2] hover:text-white transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}
