// 资源管理器
class AssetManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onAllLoaded = null;
    }

    // 定义所有需要加载的资源
    getAssetList() {
        return {
            // 背景
            'background': 'assets/map01.jpeg',
            
            // 子弹
            'bullet1': 'assets/bullet1.png',
            'bullet2': 'assets/bullet2.png', 
            'bullet3': 'assets/bullet3.png',
            
            // 玩家左侧精灵
            'player_left': 'assets/PL/player.png',
            'player_left_1': 'assets/PL/player1.png',
            'player_left_2': 'assets/PL/player2.png',
            'player_left_3': 'assets/PL/player3.png',
            'player_left_4': 'assets/PL/player4.png',
            'player_left_5': 'assets/PL/player5.png',
            'player_left_down': 'assets/PL/down.png',
            'player_left_up': 'assets/PL/up.png',
            'player_left_jump1': 'assets/PL/jump1.png',
            'player_left_jump2': 'assets/PL/jump2.png',
            'player_left_jump3': 'assets/PL/jump3.png',
            'player_left_jump4': 'assets/PL/jump4.png',
            'player_left_shooting1': 'assets/PL/shooting1.png',
            'player_left_shooting2': 'assets/PL/shooting2.png',
            'player_left_shooting3': 'assets/PL/shooting3.png',
            
            // 玩家右侧精灵
            'player_right': 'assets/PR/player.png',
            'player_right_1': 'assets/PR/player1.png',
            'player_right_2': 'assets/PR/player2.png',
            'player_right_3': 'assets/PR/player3.png',
            'player_right_4': 'assets/PR/player4.png',
            'player_right_5': 'assets/PR/player5.png',
            'player_right_down': 'assets/PR/down.png',
            'player_right_up': 'assets/PR/up.png',
            'player_right_jump1': 'assets/PR/jump1.png',
            'player_right_jump2': 'assets/PR/jump2.png',
            'player_right_jump3': 'assets/PR/jump3.png',
            'player_right_jump4': 'assets/PR/jump4.png',
            'player_right_shooting1': 'assets/PR/shooting1.png',
            'player_right_shooting2': 'assets/PR/shooting2.png',
            'player_right_shooting3': 'assets/PR/shooting3.png',
            'player_right_death1': 'assets/PR/death1.png',
            'player_right_death2': 'assets/PR/death2.png',
            
            // 敌人爆炸效果
            'enemy_boom1': 'assets/enemy/boom1.png',
            'enemy_boom2': 'assets/enemy/boom2.png',
            
            // Boss爆炸效果
            'boss_boom1': 'assets/boss/boom1.png',
            'boss_boom2': 'assets/boss/boom2.png',
            'boss_boom3': 'assets/boss/boom3.png'
        };
    }

    // 加载所有资源
    loadAssets(callback) {
        const assetList = this.getAssetList();
        this.totalCount = Object.keys(assetList).length;
        this.onAllLoaded = callback;

        if (this.totalCount === 0) {
            callback();
            return;
        }

        for (const [name, path] of Object.entries(assetList)) {
            this.loadImage(name, path);
        }
    }

    // 加载单个图片
    loadImage(name, path) {
        const img = new Image();
        img.onload = () => {
            this.images[name] = img;
            this.loadedCount++;
            this.checkAllLoaded();
        };
        
        img.onerror = () => {
            console.warn(`无法加载图片: ${path}`);
            // 创建一个占位符图片
            this.images[name] = this.createPlaceholder(32, 32);
            this.loadedCount++;
            this.checkAllLoaded();
        };
        
        img.src = path;
    }

    // 创建占位符图片
    createPlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 绘制简单的占位符
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 2, width - 4, height - 4);
        
        return canvas;
    }

    // 检查是否所有资源都已加载
    checkAllLoaded() {
        if (this.loadedCount >= this.totalCount && this.onAllLoaded) {
            this.onAllLoaded();
        }
    }

    // 获取图片
    getImage(name) {
        return this.images[name] || this.createPlaceholder(32, 32);
    }

    // 获取加载进度
    getLoadProgress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 1;
    }

    // 是否加载完成
    isLoaded() {
        return this.loadedCount >= this.totalCount;
    }
}
