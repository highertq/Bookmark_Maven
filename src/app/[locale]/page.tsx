// 导入客户端组件包装器
import { UploadBookmarkClient } from '@/components/client-wrapper';
import LanguageSwitcher from '@/components/language-switcher';
import { getTranslations } from 'next-intl/server';

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

export default async function Home({ 
  params
}: { 
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'header' });
  const tHero = await getTranslations({ locale, namespace: 'hero' });
  const tFeatures = await getTranslations({ locale, namespace: 'features' });
  const tSecurity = await getTranslations({ locale, namespace: 'security' });
  const tFooter = await getTranslations({ locale, namespace: 'footer' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">{t('subtitle')}</span> - {t('description')}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 主要内容区 */}
        <div className="max-w-4xl mx-auto">
          {/* 头部介绍区域 */}
          <section className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">{tHero('title')}</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {tHero('description')}
            </p>
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              {tHero.rich('stats', {
                strong: (chunks) => <strong className="font-bold mx-1">{chunks}</strong>
              })}
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
              <h2 className="text-xl font-semibold">{tHero('cta')}</h2>
            </div>
            <UploadBookmarkClient />
          </div>

          {/* 特色功能介绍 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-center mb-8">{tFeatures('title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard 
                icon="🔍" 
                title={tFeatures('aiAnalysis.title')} 
                description={tFeatures('aiAnalysis.description')}
              />
              <FeatureCard 
                icon="🏷️" 
                title={tFeatures('personalityTags.title')} 
                description={tFeatures('personalityTags.description')}
              />
              <FeatureCard 
                icon="🎨" 
                title={tFeatures('beautifulCards.title')} 
                description={tFeatures('beautifulCards.description')}
              />
            </div>
          </section>

          {/* 用户信任与安全保障 */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-12">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900">{tSecurity('title')}</h3>
            </div>
            <p className="text-gray-600 ml-7">
              {tSecurity('description')}
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{tFooter('title')}</h2>
            <p className="text-gray-600 mb-4">{tFooter('subtitle')}</p>
            <p className="text-gray-500 text-sm">
              {tFooter('copyright', { year: new Date().getFullYear() })} | 
              <a href={`/${locale}/privacy`} className="hover:underline ml-1">{tFooter('privacyPolicy')}</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
