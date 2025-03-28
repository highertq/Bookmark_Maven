'use client';

import { useEffect } from 'react';

export default function BodyAttributeCleaner() {
  useEffect(() => {
    // 使用requestAnimationFrame确保在DOM完全加载后再移除属性
    const cleanupAttributes = () => {
      if (document.body.hasAttribute('inmaintabuse')) {
        console.log('检测到inmaintabuse属性，正在移除...');
        document.body.removeAttribute('inmaintabuse');
      }
    };
    
    // 使用requestAnimationFrame确保在下一帧渲染时执行，这时DOM已完全加载
    requestAnimationFrame(cleanupAttributes);
  }, []);

  return null; // 这个组件不渲染任何内容
}