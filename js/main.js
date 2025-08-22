// 主入口文件
let game;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器是否支持Canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas.getContext) {
        alert('您的浏览器不支持HTML5 Canvas，请升级浏览器。');
        return;
    }
    
    // 初始化游戏
    try {
        game = new Game();
        console.log('Contra Web Game 初始化成功!');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试。');
    }
});

// 防止页面刷新时的键盘事件
window.addEventListener('beforeunload', (e) => {
    // 可以在这里保存游戏状态
});

// 处理页面失去焦点时暂停游戏
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时可以暂停游戏
        console.log('页面失去焦点，游戏继续运行...');
    } else {
        // 页面重新获得焦点
        console.log('页面重新获得焦点');
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('游戏运行时错误:', e.error);
});

// 调试信息（开发模式）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('开发模式已启用');
    
    // 添加调试键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.code === 'F1') {
            e.preventDefault();
            console.log('调试信息:');
            if (game) {
                console.log('游戏状态:', game.gameState);
                console.log('玩家位置:', game.player.x, game.player.y);
                console.log('敌人数量:', game.enemyManager.enemies.length);
                console.log('子弹数量:', game.bulletManager.bullets.length);
                console.log('分数:', game.settings.score);
            }
        }
    });
}
