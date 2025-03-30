// 导入客户端组件包装器
import { UploadBookmarkClient } from '@/components/client-wrapper';
import Image from 'next/image';

// 特色卡片组件
function FeatureCard({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">书签专家</h1>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">为您的浏览习惯生成专属网络人格画像</span> - 根据您的书签，发现您的网络身份
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 主要内容区 */}
        <div className="max-w-4xl mx-auto">
          {/* 头部介绍区域 */}
          <section className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">发现您隐藏的网络人格</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              您的书签透露了什么样的性格和习惯？上传您的浏览器书签，AI将深度分析并给您专属网络人格画像。
            </p>
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              ✨ 已有<span className="font-bold mx-1">5000+</span>用户发现了自己的网络性格 ✨
            </div>
          </section>

          {/* 上传区域 */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <div className="flex items-center justify-center mb-6">
              <span className="inline-block p-3 bg-blue-100 text-blue-700 rounded-full mr-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                </svg>
              </span>
              <h2 className="text-xl font-semibold">上传书签，解锁你的网络人格</h2>
            </div>
            <UploadBookmarkClient />
          </div>

          {/* 特色功能介绍 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-center mb-8">专业分析，个性洞察</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard 
                icon="🔍" 
                title="AI深度分析" 
                description="先进算法智能分析您的书签内容、类别分布和浏览偏好，揭示您的网络行为模式"
              />
              <FeatureCard 
                icon="🏷️" 
                title="专属性格标签" 
                description="根据分析结果为您生成独特网络身份标签，如'科技探索家'、'知识收藏家'等"
              />
              <FeatureCard 
                icon="🎨" 
                title="精美分享卡片" 
                description="自动生成个性化图片卡片，展示您的网络人格，随时保存或分享给朋友"
              />
            </div>
          </section>

          {/* 用户信任与安全保障 */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-12">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900">100% 安全和隐私保护</h3>
            </div>
            <p className="text-gray-600 ml-7">
              您的书签数据完全在本地处理，我们不会存储或分享您的个人浏览历史。分析完成后，您可以选择是否保存结果。
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">书签专家</h2>
            <p className="text-gray-600 mb-4">探索你的网络性格，发现真实的自我</p>
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} 书签专家 | <a href="/privacy" className="hover:underline">隐私政策</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
