const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Add CORS headers for CloudFront proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let filePath = '.' + req.url;
    
    // Handle proxy path prefix (remove /proxy/3000 if present)
    if (req.url.startsWith('/proxy/3000')) {
        filePath = '.' + req.url.replace('/proxy/3000', '') || './index.html';
    }
    
    // 如果请求根路径，返回index.html
    if (filePath === './' || filePath === './proxy/3000' || filePath === './proxy/3000/') {
        filePath = './index.html';
    }
    
    // 如果请求favicon.ico但文件不存在，返回204 No Content
    if (req.url === '/favicon.ico' || req.url.endsWith('/favicon.ico')) {
        res.writeHead(204, { 'Content-Type': 'image/x-icon' });
        res.end();
        return;
    }
    
    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在
                console.log(`404 - File not found: ${filePath} (original URL: ${req.url})`);
                res.writeHead(404, { 
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(`<h1>404 - File Not Found</h1><p>Requested: ${req.url}</p><p>Resolved to: ${filePath}</p>`, 'utf-8');
            } else {
                // 服务器错误
                console.log(`500 - Server error: ${error.code} for ${filePath}`);
                res.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
                res.end('Server Internal Error: ' + error.code, 'utf-8');
            }
        } else {
            // 成功返回文件
            console.log(`200 - Serving: ${filePath} (${mimeType})`);
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, mimeType.startsWith('text/') || mimeType.includes('javascript') ? 'utf-8' : undefined);
        }
    });
});

server.listen(port, () => {
    console.log(`Contra Web Game 服务器运行在 http://localhost:${port}`);
    console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
