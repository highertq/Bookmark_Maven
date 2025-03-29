// 导入客户端组件包装器
import { UploadBookmarkClient } from '@/components/client-wrapper';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">书签热辣点评</h1>
          <p className="text-gray-600 mt-1">上传书签，获取AI对你上网习惯的热辣点评和数据分析</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">上传书签</h2>
          <UploadBookmarkClient />
        </div>
      </main>
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>Copyright © {new Date().getFullYear()} 书签热评</p>
      </footer>
    </div>
  );
}
