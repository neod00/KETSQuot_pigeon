import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page narrow">
      <p className="eyebrow">404</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link className="button" href="/">
        처음으로
      </Link>
    </div>
  );
}
