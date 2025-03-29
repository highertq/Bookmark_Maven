// 这个脚本用于加载和处理项目根目录中的bookmarks_2025_3_29.html文件
// 在开发模式下使用，启动项目后，手动将bookmarks_2025_3_29.html复制到public文件夹
// 然后这个文件就可以通过 /bookmarks_2025_3_29.html 访问

const fs = require('fs');
const path = require('path');

// 源文件路径
const sourceFilePath = path.join(__dirname, '../bookmarks_2025_3_29.html');
// 目标文件路径
const targetFilePath = path.join(__dirname, '../public/bookmarks_2025_3_29.html');

// 复制文件
try {
  if (fs.existsSync(sourceFilePath)) {
    const content = fs.readFileSync(sourceFilePath, 'utf8');
    
    if (!fs.existsSync(path.dirname(targetFilePath))) {
      fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
    }
    
    fs.writeFileSync(targetFilePath, content);
    console.log('书签文件已复制到public文件夹，现在可以通过 /bookmarks_2025_3_29.html 访问');
  } else {
    console.error('找不到源文件:', sourceFilePath);
  }
} catch (error) {
  console.error('处理书签文件时出错:', error);
} 