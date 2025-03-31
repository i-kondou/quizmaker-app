import { Link } from "react-router-dom";

const Navigation = () => (
  <nav className="bg-gray-100 p-4 mb-6 shadow-sm">
    <ul className="flex justify-center space-x-6">
      <li>
        {/* Linkコンポーネントでページ遷移 */}
        <Link
          to="/"
          className="text-lg text-blue-700 hover:text-blue-900 hover:underline"
        >
          画像管理
        </Link>
      </li>
      <li>
        <Link
          to="/heritages"
          className="text-lg text-blue-700 hover:text-blue-900 hover:underline"
        >
          世界遺産一覧
        </Link>
      </li>
    </ul>
  </nav>
);

// コンポーネントをエクスポート
export default Navigation;
