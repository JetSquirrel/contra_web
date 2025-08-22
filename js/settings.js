// 游戏设置类
class Settings {
    constructor() {
        this.screenWidth = 1200;
        this.screenHeight = 750;
        this.playerSpeed = 5;
        this.jumpVel = -14.0; // 跳跃初始速度
        this.gravity = 0.8; // 重力
        this.bulletSpeed = 17;
        this.enemySpeed = 4;
        this.scrollSpeed = 5; // 屏幕滚动速度
        
        // 游戏状态
        this.screenRolling = false;
        this.playerIsAlive = true;
        this.playersLimit = 3;
        this.playerLives = 3;
        this.score = 0;
        
        // Boss相关
        this.bossAppear = false;
        this.bossJumpVel = -12.0;
        this.bossDirection = 1; // 1为向左，-1为向右
        this.bossAlive = true;
        this.gameWin = false;
        
        // 敌人生成
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 120; // 2秒生成一个敌人(60fps)
        
        // 游戏难度
        this.difficultyLevel = 1;
        this.enemiesKilled = 0;
        
        // 地面Y坐标
        this.groundY = 380;
    }
    
    // 增加难度
    increaseDifficulty() {
        this.difficultyLevel++;
        this.enemySpeed += 1;
        this.enemySpawnInterval = Math.max(30, this.enemySpawnInterval - 10);
    }
    
    // 重置游戏
    reset() {
        this.playerIsAlive = true;
        this.playerLives = 3;
        this.score = 0;
        this.bossAppear = false;
        this.bossAlive = true;
        this.gameWin = false;
        this.enemiesKilled = 0;
        this.difficultyLevel = 1;
        this.enemySpeed = 4;
        this.enemySpawnInterval = 120;
        this.screenRolling = false;
    }
}
