'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BrowserGuide {
  name: string;
  icon: string;
  steps: {
    windows?: string[];
    mac?: string[];
    linux?: string[];
    android?: string[];
    ios?: string[];
  };
}

const exportGuides: BrowserGuide[] = [
  {
    name: 'Chrome',
    icon: '🌐',
    steps: {
      windows: [
        '点击右上角的三点图标',
        '选择"书签" > "书签管理器"（快捷键: Ctrl+Shift+O）',
        '点击书签管理器右上角的三点图标',
        '选择"导出书签"',
        '选择保存位置并保存.html文件'
      ],
      mac: [
        '点击右上角的三点图标',
        '选择"书签" > "书签管理器"（快捷键: ⌘+Option+B）',
        '点击书签管理器右上角的三点图标',
        '选择"导出书签"',
        '选择保存位置并保存.html文件'
      ],
      linux: [
        '点击右上角的三点图标',
        '选择"书签" > "书签管理器"（快捷键: Ctrl+Shift+O）',
        '点击书签管理器右上角的三点图标',
        '选择"导出书签"',
        '选择保存位置并保存.html文件'
      ]
    }
  },
  {
    name: 'Firefox',
    icon: '🦊',
    steps: {
      windows: [
        '点击右上角的三横线菜单按钮',
        '选择"书签" > "管理书签"（快捷键: Ctrl+Shift+B）',
        '点击"导入和备份" > "导出书签为HTML"',
        '选择保存位置并保存.html文件'
      ],
      mac: [
        '点击右上角的三横线菜单按钮',
        '选择"书签" > "管理书签"（快捷键: ⌘+Shift+B）',
        '点击"导入和备份" > "导出书签为HTML"',
        '选择保存位置并保存.html文件'
      ],
      linux: [
        '点击右上角的三横线菜单按钮',
        '选择"书签" > "管理书签"（快捷键: Ctrl+Shift+B）',
        '点击"导入和备份" > "导出书签为HTML"',
        '选择保存位置并保存.html文件'
      ]
    }
  },
  {
    name: 'Edge',
    icon: '📐',
    steps: {
      windows: [
        '点击右上角的三点图标',
        '选择"收藏" > "管理收藏"',
        '点击右上角的三点图标',
        '选择"导出收藏"',
        '选择保存位置并保存.html文件'
      ],
      mac: [
        '点击右上角的三点图标',
        '选择"收藏" > "管理收藏"',
        '点击右上角的三点图标',
        '选择"导出收藏"',
        '选择保存位置并保存.html文件'
      ]
    }
  },
  {
    name: 'Safari',
    icon: '🧭',
    steps: {
      mac: [
        '点击"文件" > "导出" > "书签"',
        '选择保存位置并保存.html文件'
      ],
      ios: [
        'Safari不支持直接从iOS设备导出书签',
        '需要通过iCloud同步书签到Mac或PC',
        '然后在电脑上按照相应浏览器的步骤导出'
      ]
    }
  },
  {
    name: '手机浏览器',
    icon: '📱',
    steps: {
      android: [
        '大多数手机浏览器不支持直接导出书签',
        '建议通过同步功能将书签同步到PC版浏览器',
        '然后在电脑上导出HTML格式文件'
      ],
      ios: [
        'iOS设备需要通过iCloud同步书签到Mac或PC',
        '然后在电脑上按照相应浏览器的步骤导出'
      ]
    }
  }
];

interface ExportHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportHelpDialog({ isOpen, onClose }: ExportHelpDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('Chrome');
  const [activePlatform, setActivePlatform] = useState<string>('windows');

  useEffect(() => {
    // 自动检测平台
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('macintosh') !== -1 || userAgent.indexOf('darwin') !== -1) {
      setActivePlatform('mac');
    } else if (userAgent.indexOf('linux') !== -1) {
      setActivePlatform('linux');
    } else if (userAgent.indexOf('android') !== -1) {
      setActivePlatform('android');
    } else if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) {
      setActivePlatform('ios');
    }
  }, []);

  if (!isOpen) return null;

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'windows': return 'Windows';
      case 'mac': return 'Mac';
      case 'linux': return 'Linux';
      case 'android': return 'Android';
      case 'ios': return 'iOS';
      default: return platform;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">如何导出浏览器书签</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* 浏览器选择标签 */}
        <div className="flex overflow-x-auto mb-4 gap-2 pb-2">
          {exportGuides.map(guide => (
            <button
              key={guide.name}
              className={`px-4 py-2 rounded-lg flex items-center flex-shrink-0 ${activeTab === guide.name ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => setActiveTab(guide.name)}
            >
              <span className="mr-2 text-xl">{guide.icon}</span>
              {guide.name}
            </button>
          ))}
        </div>
        
        {/* 平台选择 */}
        <div className="flex mb-6 gap-2">
          {exportGuides.find(g => g.name === activeTab)?.steps && Object.keys(exportGuides.find(g => g.name === activeTab)?.steps || {}).map(platform => (
            <button
              key={platform}
              className={`px-3 py-1 rounded-md text-sm ${activePlatform === platform ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => setActivePlatform(platform)}
            >
              {getPlatformLabel(platform)}
            </button>
          ))}
        </div>
        
        {/* 导出步骤 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">
            {activeTab} 浏览器（{getPlatformLabel(activePlatform)}）导出步骤：
          </h3>
          
          <ol className="list-decimal pl-5 space-y-2">
            {exportGuides.find(g => g.name === activeTab)?.steps[activePlatform as keyof typeof exportGuides[0]['steps']]?.map((step, index) => (
              <li key={index} className="text-gray-700">{step}</li>
            )) || (
              <li className="text-amber-600">此平台上没有可用的指南，请尝试其他平台。</li>
            )}
          </ol>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg text-blue-700">
          <h4 className="font-medium mb-2">提示</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>导出的书签文件通常被保存为HTML格式</li>
            <li>部分浏览器导出的文件名可能为"bookmarks.html"或"书签.html"</li>
            <li>导出后的书签文件可以直接上传到本工具进行分析</li>
            <li>如果您的书签数量很多，导出过程可能需要一些时间</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 