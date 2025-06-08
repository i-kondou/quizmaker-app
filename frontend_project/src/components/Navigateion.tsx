import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const getLinkClass = (path: string, isExact: boolean = true) => {
    const isActive = isExact
      ? location.pathname === path
      : location.pathname.startsWith(path);
    return isActive
      ? "text-lg text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1"
      : "text-lg text-blue-700 hover:text-blue-900 hover:underline pb-1";
  };

  return (
    <nav className="bg-gray-100 p-4 mb-6 shadow-sm sticky top-0 z-40">
      <ul className="flex justify-center space-x-6">
        <li>
          {/* Linkコンポーネントでページ遷移 */}
          <Link to="/" className={getLinkClass("/")}>
            画像管理
          </Link>
        </li>
        <li>
          <Link to="/heritages" className={getLinkClass("/heritages", false)}>
            世界遺産一覧
          </Link>
        </li>
        <li>
          <Link
            to="/quiz/play?mode=random"
            className={getLinkClass("/quiz/play", false)}
          >
            クイズに挑戦
          </Link>
        </li>
      </ul>
    </nav>
  );
};

// コンポーネントをエクスポート
export default Navigation;
