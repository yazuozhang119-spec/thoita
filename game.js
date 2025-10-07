// 游戏配置
const config = {
    serverAddress: 'wss://thoita-prod-1g7djd2id1fdb4d2-1381831241.ap-shanghai.run.wxcloudrun.com/ws', // 服务器地址
    canvasWidth: 1200,
    canvasHeight: 800,
    playerSize: 40,
    petalSize: 30,
    mobSize: 60,
    fps: 30,
    backgroundColor: '#0a4d0a'
};

// 游戏状态
const gameState = {
    playerId: null,
    connected: false,
    playerName: 'Player',
    playerHealth: 100,
    playerMaxHealth: 100,
    playerPosition: { x: 0, y: 0 },
    boundaryRadius: 0,
    playerAngle: 0,
    playerState: 0, // 0: 正常, 1: 攻击, -1: 防御
    petals: [],
    mobs: [],
    flowers: [],
    collectDrops: [],
    lastFrameTime: 0,
    fps: 0,
    socket: null,
    // 新添加的状态
    loadedResources: 0,
    totalResources: 0,
    isLobby: true,
    equipmentSlots: 10,
    equippedPetals: Array(10).fill(null),
    availablePetals: [],
    petalImages: {},
    currentRoom: null,
    hasSelectedRoom: false,
    roomPlayers: {},
    petal_num : 5,
    heartbeatInterval: null,
    serverBuild: null,
    absorbSlots: Array(5).fill(null),
    isAbsorbing: false,
    // 音频状态
    backgroundMusic: null,
    deathSound: null,
    volume: 0.5,
    isMuted: false,
    musicEnabled: true,
    absorbTotalCount: 0, // 记录总花瓣数量
    currentAbsorbType: null,
    currentAbsorbLevel: null,
    cachedAbsorbResult: null, // 缓存的合成结果（等待动画结束）
    effects: [],
    wave: {
        current: 1,
        timer: 0,
        duration: 120,
        spawn_phase_duration: 60,
        is_spawn_phase: true
    },
    // 聊天相关状态
    chatType: 'room', // room, global, private
    privateTarget: '', // 私聊目标
    chatHistory: {
        room: [],
        global: [],
        private: []
    },
    isChatClosed: false
};

// DOM 元素
const absorbSlotsContainer = document.getElementById('absorbSlotsContainer');
const absorbResult = document.getElementById('absorbResult');
const resultContent = document.getElementById('resultContent');
const closeResult = document.getElementById('closeResult');
const absorbPetalSelection = document.getElementById('absorbPetalSelection');
const absorbActionButton = document.getElementById('absorbActionButton'); // 合成界面的按钮
const absorbLobbyButton = document.getElementById('absorbLobbyButton');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthFill = document.getElementById('healthFill');
const fpsDisplay = document.getElementById('fps');
const startScreen = document.getElementById('startScreen');
const playerNameInput = document.getElementById('playerName');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');
const lobbyUI = document.getElementById('lobbyUI');
const equipmentSlots = document.getElementById('equipmentSlots');
const bagWindow = document.getElementById('bagWindow');
const absorbWindow = document.getElementById('absorbWindow');
const galleryWindow = document.getElementById('galleryWindow');
const closeBag = document.getElementById('closeBag');
const closeAbsorb = document.getElementById('closeAbsorb');
const closeGallery = document.getElementById('closeGallery');
const bagButton = document.getElementById('bagButton');
const absorbButton = document.getElementById('absorbButton');
const galleryButton = document.getElementById('galleryButton');
const readyButton = document.getElementById('readyButton');
const loadingScreen = document.getElementById('loadingScreen');
const progressFill = document.getElementById('progressFill');
const loadingText = document.getElementById('loadingText');
const roomSelection = document.getElementById('roomSelection');
const roomPlayers = document.getElementById('roomPlayers');
const roomInfo = document.getElementById('roomInfo');

const waveBar = document.getElementById('waveBar');
const waveText = document.getElementById('waveText');
const waveProgressFill = document.getElementById('waveProgressFill');
const waveProgressContainer = document.getElementById('waveProgressContainer');

// 聊天界面元素
const chatContainer = document.getElementById('chatContainer');
const chatHeader = document.getElementById('chatHeader');
const chatTitle = document.getElementById('chatTitle');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendButton = document.getElementById('chatSendButton');
const chatClose = document.getElementById('chatClose');
const chatOpenButton = document.getElementById('chatOpenButton');
const chatTypeSelector = document.getElementById('chatTypeSelector');
const chatTypeButtons = chatTypeSelector.querySelectorAll('.chat-type-button');

// 资源列表 - 需要加载的图片（根据实际文件名修改）
const resources = [
    // 花瓣图片（使用实际文件名）
    '01.png', '02.png', '03.png', '04.png', '05.png', '06.png', '07.png',
    '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png',
    '31.png', '32.png', '33.png', '34.png', '35.png', '36.png', '37.png',
    '41.png', '42.png', '43.png', '44.png', '45.png', '46.png', '47.png',
    '51.png', '52.png', '53.png', '54.png', '55.png', '56.png', '57.png', // thunder (类型5)
    '61.png', '62.png', '63.png', '64.png', '65.png', '66.png', '67.png', // venom (类型6)
    '71.png', '72.png', '73.png', '74.png', '75.png', '76.png', '77.png', // shield (类型7)
    '81.png', '82.png', '83.png', '84.png', '85.png', '86.png', '87.png', // bomb (类型8)
    '91.png', '92.png', '93.png', '94.png', '95.png', '96.png', '97.png', // magnet (类型9)
    '101.png', '102.png', '103.png', '104.png', '105.png', '106.png', '107.png', // thirdeye (类型10)
    // 怪物图片
    'hornet.png', 'centipede0.png', 'centipede1.png', 'rock.png', 'ladybug.png',
    'thunderelement.png', 'venomspider.png', 'shieldguardian.png', 'bombbeetle.png',
    // 其他图片
    'flower.png', 'backgroundmini.png', 'background.png', 'logo.png',
    // UI元素
    'bag.png', 'absorb.png', 'gallery.png', 'ready.png', 'none.png',
    // 游戏内花瓣图片
    'wing.png', 'missile.png', 'basic.png', 'leaf.png', 'hornetMissile.png',
    'thunder.png', 'venom.png', 'shield.png', 'bomb.png', 'magnet.png', 'thirdeye.png'
];

// 音频系统初始化
function initAudioSystem() {
    try {
        console.log('开始初始化音频系统...');
        console.log('当前页面协议:', window.location.protocol);
        console.log('当前页面主机:', window.location.host);

        // 检查是否通过HTTP服务器访问
        if (window.location.protocol === 'file:') {
            console.warn('警告：你正在通过file://协议访问页面，这可能导致音频加载失败。');
            console.warn('请通过HTTP服务器访问页面，例如：http://localhost:8888');
        }

        // 尝试多种音频格式
        const backgroundFormats = ['background.mp3'];
        const deathFormats = ['death.mp3'];

        // 创建背景音乐对象
        gameState.backgroundMusic = createAudioWithFallback('背景音乐', backgroundFormats);

        // 创建死亡音效对象
        gameState.deathSound = createAudioWithFallback('死亡音效', deathFormats);

        // 如果音频加载成功，设置属性
        if (gameState.backgroundMusic) {
            gameState.backgroundMusic.loop = true;
            gameState.backgroundMusic.volume = gameState.volume;
            console.log('背景音乐加载成功');
        } else {
            console.log('所有背景音乐格式都加载失败');
            gameState.musicEnabled = false;
        }

        if (gameState.deathSound) {
            gameState.deathSound.volume = gameState.volume;
            console.log('死亡音效加载成功');
        } else {
            console.log('所有死亡音效格式都加载失败');
        }

        // 初始化音量控制UI
        initVolumeControls();

        // 用户交互后播放背景音乐（浏览器政策要求）
        document.addEventListener('click', function playBackgroundMusic() {
            if (gameState.musicEnabled && gameState.backgroundMusic && gameState.backgroundMusic.paused) {
                gameState.backgroundMusic.play().catch(e => {
                    console.log('背景音乐自动播放失败:', e);
                });
            }
            document.removeEventListener('click', playBackgroundMusic);
        }, { once: true });

        console.log('音频系统初始化完成');
    } catch (error) {
        console.log('音频系统初始化失败:', error);
        gameState.musicEnabled = false;
    }
}

// 创建带格式的音频对象
function createAudioWithFallback(name, formats) {
    for (let format of formats) {
        try {
            const audio = new Audio();

            // 设置事件监听器
            audio.addEventListener('canplaythrough', function() {
                console.log(`${name} (${format}) 加载完成`);
            }, { once: true });

            audio.addEventListener('error', function(e) {
                console.log(`${name} (${format}) 加载失败:`, e);
            }, { once: true });

            // 尝试加载
            audio.src = format;
            audio.load();

            // 检查是否能够加载
            return audio;

        } catch (error) {
            console.log(`创建 ${name} (${format}) 失败:`, error);
            continue;
        }
    }
    return null;
}

// 初始化音量控制
function initVolumeControls() {
    const volumeToggle = document.getElementById('volumeToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeRange = document.getElementById('volumeRange');
    const volumeValue = document.getElementById('volumeValue');
    const testAudioBtn = document.getElementById('testAudioBtn');

    // 音量按钮点击事件
    volumeToggle.addEventListener('click', function() {
        const sliderContainer = document.getElementById('volumeSlider');
        const isVisible = sliderContainer.style.display !== 'none';

        if (isVisible) {
            sliderContainer.style.display = 'none';
        } else {
            sliderContainer.style.display = 'block';
        }
    });

    // 音量滑块变化事件
    volumeRange.addEventListener('input', function() {
        const volume = this.value / 100;
        gameState.volume = volume;
        gameState.isMuted = volume === 0;

        // 更新音频音量
        if (gameState.backgroundMusic) {
            gameState.backgroundMusic.volume = volume;
        }
        if (gameState.deathSound) {
            gameState.deathSound.volume = volume;
        }

        // 更新显示
        volumeValue.textContent = this.value + '%';

        // 更新按钮图标
        updateVolumeButton(volume);
    });

    // 测试音频按钮
    testAudioBtn.addEventListener('click', function() {
        testAudio();
    });

    // 点击其他地方关闭音量滑块
    document.addEventListener('click', function(event) {
        const volumeControl = document.getElementById('volumeControl');
        if (!volumeControl.contains(event.target)) {
            document.getElementById('volumeSlider').style.display = 'none';
        }
    });
}

// 测试音频功能
function testAudio() {
    console.log('=== 音频测试开始 ===');
    console.log('音乐启用状态:', gameState.musicEnabled);
    console.log('当前音量:', gameState.volume);
    console.log('静音状态:', gameState.isMuted);

    if (gameState.backgroundMusic) {
        console.log('背景音乐对象存在');
        console.log('背景音乐当前状态:', {
            paused: gameState.backgroundMusic.paused,
            currentTime: gameState.backgroundMusic.currentTime,
            duration: gameState.backgroundMusic.duration,
            readyState: gameState.backgroundMusic.readyState
        });

        // 尝试播放背景音乐
        gameState.backgroundMusic.play().then(() => {
            console.log('背景音乐播放成功！');
            setTimeout(() => {
                gameState.backgroundMusic.pause();
                console.log('背景音乐测试停止');
            }, 3000); // 播放3秒后停止
        }).catch(error => {
            console.error('背景音乐播放失败:', error);
        });
    } else {
        console.error('背景音乐对象不存在！');
    }

    if (gameState.deathSound) {
        console.log('死亡音效对象存在');
        // 测试死亡音效
        gameState.deathSound.play().then(() => {
            console.log('死亡音效播放成功！');
        }).catch(error => {
            console.error('死亡音效播放失败:', error);
        });
    } else {
        console.error('死亡音效对象不存在！');
    }

    console.log('=== 音频测试结束 ===');
}

// 更新音量按钮图标
function updateVolumeButton(volume) {
    const volumeToggle = document.getElementById('volumeToggle');
    if (volume === 0) {
        volumeToggle.textContent = '🔇';
    } else if (volume < 0.5) {
        volumeToggle.textContent = '🔉';
    } else {
        volumeToggle.textContent = '🔊';
    }
}

// 播放死亡音效
function playDeathSound() {
    if (gameState.deathSound && !gameState.isMuted && gameState.volume > 0) {
        gameState.deathSound.currentTime = 0; // 重置到开始位置
        gameState.deathSound.play().catch(e => {
            console.log('死亡音效播放失败:', e);
        });
    }
}

// 开始播放背景音乐
function startBackgroundMusic() {
    if (gameState.backgroundMusic && gameState.musicEnabled && !gameState.isMuted && gameState.volume > 0) {
        gameState.backgroundMusic.play().catch(e => {
            console.log('背景音乐播放失败:', e);
        });
    }
}

// 停止背景音乐
function stopBackgroundMusic() {
    if (gameState.backgroundMusic) {
        gameState.backgroundMusic.pause();
        gameState.backgroundMusic.currentTime = 0;
    }
}

// 初始化游戏
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化音频系统
    initAudioSystem();

    connectToServer()

    // 事件监听
    startButton.addEventListener('click', showLobby);
    restartButton.addEventListener('click', restartGame);

    // 大厅按钮事件
    bagButton.addEventListener('click', () => showWindow('bag'));
    absorbLobbyButton.addEventListener('click', () => showWindow('absorb'));
    galleryButton.addEventListener('click', () => showWindow('gallery'));
    readyButton.addEventListener('click', () => {
    if (readyButton.textContent === 'Ready') {
        readyToPlay();
    } else if (readyButton.textContent === '取消准备') {
        cancelReady();
    }
});

    // 关闭窗口按钮
    closeBag.addEventListener('click', () => hideWindow('bag'));
    closeAbsorb.addEventListener('click', () => hideWindow('absorb'));
    closeGallery.addEventListener('click', () => hideWindow('gallery'));



    // 房间选择按钮
    const roomButtons = roomSelection.querySelectorAll('.room-button');
    roomButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            roomButtons.forEach(btn => btn.classList.remove('active'));
            // 添加active类到当前按钮
            button.classList.add('active');
            // 更新当前房间
            gameState.currentRoom = parseInt(button.dataset.room);
            gameState.hasSelectedRoom = true;
            updateRoomInfo();
            // 发送房间切换消息到服务器
            if (gameState.connected) {
                sendToServer({
                    COMMAND: 'CHANGEROOM',
                    client_name: gameState.playerName,
                    room_id: gameState.currentRoom,
                    leave_room_id: getPreviousRoom(),
                    build: gameState.equippedPetals.map(petal => {
                        return petal ? [petal.type, petal.level] : [-1, 0];
                    }),
                    id: gameState.playerId
                });
            }
        });
    });

    // 鼠标事件
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // 加载资源
    loadResources();
    initializeAbsorbWindow();

    // 初始化聊天功能
    initializeChat();

    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}


function initializeAbsorbWindow() {
    initializeAbsorbSlots();
    initializeAbsorbPetalSelection();

    // 事件监听
    absorbActionButton.addEventListener('click', startAbsorb);
    closeResult.addEventListener('click', () => {
        absorbResult.style.display = 'none';
    });

}

function initializeAbsorbSlots() {
    const slots = absorbSlotsContainer.querySelectorAll('.absorb-slot');

    slots.forEach(slot => {
        // 清除现有内容
        slot.innerHTML = '';
        slot.classList.remove('filled', 'drag-over');

        // 添加拖拽事件
        slot.addEventListener('dragover', handleAbsorbDragOver);
        slot.addEventListener('dragenter', handleAbsorbDragEnter);
        slot.addEventListener('dragleave', handleAbsorbDragLeave);
        slot.addEventListener('drop', handleAbsorbDrop);

        // 添加点击移除事件
        slot.addEventListener('click', (e) => {
            if (slot.classList.contains('filled') && !e.target.classList.contains('remove-petal')) {
                removePetalFromAbsorbSlot(parseInt(slot.dataset.index));
            }
        });
    });

    updateAbsorbButton();
}

// 初始化可用的花瓣选择
function initializeAbsorbPetalSelection() {
    updateAbsorbPetalSelection();
}

// 更新可用的花瓣选择
function updateAbsorbPetalSelection() {
    absorbPetalSelection.innerHTML = '';

    gameState.availablePetals.forEach((petal, index) => {
        if (petal.count > 0) {
            const item = document.createElement('div');
            item.className = 'absorb-petal-item';
            item.draggable = true;
            item.dataset.index = index;
            item.title = `类型: ${petal.type}, 等级: ${petal.level}, 数量: ${petal.count}`;

            // 获取正确的图片名称
            const imgName = getPetalImageName(petal.type, petal.level);

            if (gameState.petalImages[imgName]) {
                const img = document.createElement('img');
                img.src = imgName;
                img.alt = `类型: ${petal.type}, 等级: ${petal.level}`;
                item.appendChild(img);
            } else {
                item.textContent = `${petal.type}-${petal.level}`;
                item.style.fontSize = '8px';
            }

            // 添加数量标签
            const countBadge = document.createElement('div');
            countBadge.className = 'absorb-petal-count';
            countBadge.textContent = petal.count;
            item.appendChild(countBadge);

            item.addEventListener('dragstart', handleAbsorbPetalDragStart);
            item.addEventListener('dragend', handleAbsorbPetalDragEnd);

            // 添加点击事件（作为拖拽的替代）
            item.addEventListener('click', () => {
                addPetalToFirstEmptySlot(petal, index);
            });

            absorbPetalSelection.appendChild(item);
        }
    });
}

// 拖拽开始处理
function handleAbsorbPetalDragStart(e) {
    const petalItem = e.target.closest('.absorb-petal-item');
    if (!petalItem) return;

    const index = petalItem.dataset.index;
    e.dataTransfer.setData('text/plain', index);
    petalItem.style.opacity = '0.5';
}

// 拖拽结束处理
function handleAbsorbPetalDragEnd(e) {
    e.target.style.opacity = '1';
}

// 拖拽经过处理
function handleAbsorbDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function updateWaveBar(waveData) {
    if (!waveData) return;

    // 更新wave状态
    gameState.wave = waveData;

    // 更新wave文本
    waveText.textContent = `Wave: ${waveData.current}`;

    // 计算进度百分比
    const progressPercent = (waveData.timer / waveData.duration) * 100;

    // 更新进度条
    waveProgressFill.style.width = `${progressPercent}%`;

    // 根据阶段切换颜色
    if (waveData.is_spawn_phase) {
        waveProgressFill.className = 'green';
    } else {
        waveProgressFill.className = 'red';
    }

    // 显示/隐藏进度条（游戏开始时显示）
    if (!gameState.isLobby) {
        waveBar.style.display = 'block';
    } else {
        waveBar.style.display = 'none';
    }
}

function handleAbsorbDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('absorb-slot') && !e.target.classList.contains('filled')) {
        e.target.classList.add('drag-over');
    }
}

function handleAbsorbDragLeave(e) {
    e.preventDefault();
    if (e.target.classList.contains('absorb-slot')) {
        e.target.classList.remove('drag-over');
    }
}

// 拖拽放下处理
function handleAbsorbDrop(e) {
    e.preventDefault();

    const slot = e.target.closest('.absorb-slot');
    if (!slot || slot.classList.contains('filled')) return;

    slot.classList.remove('drag-over');

    const petalIndex = e.dataTransfer.getData('text/plain');
    const slotIndex = parseInt(slot.dataset.index);

    if (petalIndex !== '') {
        addPetalToAbsorbSlot(parseInt(petalIndex), slotIndex);
    }
}

// 添加花瓣到合成槽位
function addPetalToAbsorbSlot(petalIndex, slotIndex) {
    if (petalIndex >= 0 && petalIndex < gameState.availablePetals.length) {
        const petal = gameState.availablePetals[petalIndex];

        // 检查花瓣数量是否足够（需要5个给5个槽位）
        if (petal.count < 5) {
            alert('该花瓣数量不足5个!');
            return;
        }

        // 如果是第一次添加，设置当前合成类型
        if (gameState.absorbTotalCount === 0) {
            gameState.currentAbsorbType = petal.type;
            gameState.currentAbsorbLevel = petal.level;
        } else {
            // 检查是否与当前合成类型相同
            if (petal.type !== gameState.currentAbsorbType || petal.level !== gameState.currentAbsorbLevel) {
                alert('只能合成相同类型和等级的花瓣!');
                return;
            }
        }

        // 给每个槽位添加1个花瓣，不管槽位是否已有花瓣
        for (let i = 0; i < 5; i++) {
            // 如果槽位为空，初始化
            if (gameState.absorbSlots[i] === null) {
                gameState.absorbSlots[i] = {
                    type: petal.type,
                    level: petal.level,
                    originalIndex: petalIndex,
                    count: 0
                };
            }

            // 检查是否是相同类型的花瓣（现在允许累加）
            if (gameState.absorbSlots[i].type === petal.type &&
                gameState.absorbSlots[i].level === petal.level) {
                gameState.absorbSlots[i].count += 1;
                petal.count -= 1;
                gameState.absorbTotalCount += 1;
                updateAbsorbSlotDisplay(i);
            }
        }

        updateAbsorbPetalSelection();
        updateAbsorbButton();
    }
}

// 添加花瓣（无论槽位是否为空）
function addPetalToFirstEmptySlot(petal, originalIndex) {
    // 直接调用添加函数，让它自己处理槽位逻辑
    addPetalToAbsorbSlot(originalIndex, 0); // 使用槽位0作为目标
}

// 更新槽位显示
function updateAbsorbSlotDisplay(slotIndex) {
    const slot = absorbSlotsContainer.querySelector(`.absorb-slot[data-index="${slotIndex}"]`);
    const petal = gameState.absorbSlots[slotIndex];

    slot.innerHTML = '';

    if (petal) {
        slot.classList.add('filled');

        // 获取正确的图片名称
        const imgName = getPetalImageName(petal.type, petal.level);

        if (gameState.petalImages[imgName]) {
            const img = document.createElement('img');
            img.src = imgName;
            img.style.maxWidth = '70%';
            img.style.maxHeight = '70%';
            slot.appendChild(img);
        } else {
            slot.textContent = `${petal.type}-${petal.level}`;
            slot.style.fontSize = '10px';
            slot.style.color = 'white';
        }

        // 显示数量标签
        const countBadge = document.createElement('div');
        countBadge.className = 'slot-petal-count';
        countBadge.textContent = petal.count || 5;
        slot.appendChild(countBadge);

        // 添加移除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-petal';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removePetalFromAbsorbSlot(slotIndex);
        });
        slot.appendChild(removeBtn);
    } else {
        slot.classList.remove('filled');
    }
}

// 从合成槽位移除花瓣
function removePetalFromAbsorbSlot(slotIndex) {
    const petal = gameState.absorbSlots[slotIndex];
    if (petal) {
        // 恢复花瓣数量（移除该槽位所有花瓣）
        const originalPetal = gameState.availablePetals[petal.originalIndex];
        if (originalPetal) {
            originalPetal.count += petal.count;
        }

        gameState.absorbTotalCount -= petal.count;
        gameState.absorbSlots[slotIndex] = null;

        // 如果所有槽位都空了，重置合成类型
        if (gameState.absorbTotalCount === 0) {
            gameState.currentAbsorbType = null;
            gameState.currentAbsorbLevel = null;
        }

        updateAbsorbSlotDisplay(slotIndex);
        updateAbsorbPetalSelection();
        updateAbsorbButton();
    }
}

// 更新合成按钮状态
function updateAbsorbButton() {
    const filledSlots = gameState.absorbSlots.filter(slot => slot !== null).length;
    absorbActionButton.disabled = gameState.absorbTotalCount < 5 || gameState.isAbsorbing;

    if (gameState.absorbTotalCount >= 5) {
        absorbActionButton.textContent = gameState.isAbsorbing ? '合成中...' :
            `开始合成 (${gameState.absorbTotalCount}个花瓣)`;
    } else {
        absorbActionButton.textContent = `需要至少5个花瓣 (${gameState.absorbTotalCount}/5)`;
    }
}

// 开始合成
function startAbsorb() {
    if (gameState.isAbsorbing) return;

    if (gameState.absorbTotalCount < 5) {
        alert('需要至少5个花瓣才能合成!');
        return;
    }

    gameState.isAbsorbing = true;
    updateAbsorbButton();

    // 添加合成中的视觉效果
    const slots = absorbSlotsContainer.querySelectorAll('.absorb-slot');
    slots.forEach(slot => {
        slot.classList.add('absorbing');
    });

    // 开始公转动画
    const pentagonSlots = absorbSlotsContainer.querySelector('.pentagon-slots');
    pentagonSlots.classList.add('rotating');

    // 发送合成请求到服务器 - 发送所有花瓣
    sendToServer({
        COMMAND: 'ABSORB',
        client_name: gameState.playerName,
        absorb_data: {
            type: gameState.currentAbsorbType,
            level: gameState.currentAbsorbLevel,
            total: gameState.absorbTotalCount
        },
        id: gameState.playerId
    });

    // 2秒后显示结果（无论服务器是否响应）
    setTimeout(() => {
        showAbsorbResultAfterAnimation(gameState.absorbTotalCount);
    }, 2000);
}

// 动画结束后显示合成结果
function showAbsorbResultAfterAnimation(totalPetalCount) {
    // 移除动画效果
    const slots = absorbSlotsContainer.querySelectorAll('.absorb-slot');
    slots.forEach(slot => {
        slot.classList.remove('absorbing');
    });

    const pentagonSlots = absorbSlotsContainer.querySelector('.pentagon-slots');
    pentagonSlots.classList.remove('rotating');

    // 检查是否有缓存的服务器结果
    if (gameState.cachedAbsorbResult) {
        displayActualResult(gameState.cachedAbsorbResult, totalPetalCount);
        gameState.cachedAbsorbResult = null;
    } else {
        // 如果没有服务器结果，显示默认成功信息
        displayDefaultResult(totalPetalCount);
    }
}

// 显示默认合成结果（用于本地演示）
function displayDefaultResult(totalPetalCount) {
    resultContent.innerHTML = '';

    const successMsg = document.createElement('p');
    successMsg.textContent = `合成完成！使用了 ${totalPetalCount} 个花瓣`;
    successMsg.style.color = '#FFD700';
    resultContent.appendChild(successMsg);

    absorbResult.style.display = 'block';

    // 清空所有槽位
    resetAbsorbSlots();

    // 重置状态
    gameState.isAbsorbing = false;
    updateAbsorbButton();
}

// 清空已合成的花瓣
function clearSynthesizedPetals(totalPetalCount) {
    let remainingToClear = totalPetalCount;

    // 从每个槽位中逐个移除花瓣（不恢复到背包，因为已被消耗）
    for (let i = 0; i < 5 && remainingToClear > 0; i++) {
        if (gameState.absorbSlots[i] !== null && gameState.absorbSlots[i].count > 0) {
            const removeCount = Math.min(gameState.absorbSlots[i].count, remainingToClear);

            // 从槽位中移除
            gameState.absorbSlots[i].count -= removeCount;
            gameState.absorbTotalCount -= removeCount;
            remainingToClear -= removeCount;

            // 如果槽位空了，清空槽位
            if (gameState.absorbSlots[i].count === 0) {
                gameState.absorbSlots[i] = null;
            }

            updateAbsorbSlotDisplay(i);
        }
    }

    // 如果没有槽位了，重置合成类型
    if (gameState.absorbTotalCount === 0) {
        gameState.currentAbsorbType = null;
        gameState.currentAbsorbLevel = null;
    }

    // 更新可用花瓣显示
    updateAbsorbPetalSelection();
    updateAbsorbButton();
}

// 显示实际的服务器结果
function displayActualResult(result, totalPetalCount) {
    gameState.isAbsorbing = false;

    // 显示结果
    resultContent.innerHTML = '';

    if (result.success) {
        const usedCount = result.total_used || totalPetalCount;
        const successMsg = document.createElement('p');
        successMsg.textContent = `合成成功! 使用了 ${usedCount} 个花瓣，成功合成 ${result.success_count} 个`;
        successMsg.style.color = '#4CAF50';
        resultContent.appendChild(successMsg);

        if (result.result_petal) {
            const resultPetal = document.createElement('div');
            resultPetal.className = 'result-petal';

            const imgName = getPetalImageName(result.result_petal[0], result.result_petal[1]);
            if (gameState.petalImages[imgName]) {
                const img = document.createElement('img');
                img.src = imgName;
                img.alt = `类型: ${result.result_petal[0]}, 等级: ${result.result_petal[1]}`;
                resultPetal.appendChild(img);
            }

            const levelText = document.createElement('div');
            levelText.textContent = `Lv.${result.result_petal[1]}`;
            levelText.style.fontSize = '12px';
            resultPetal.appendChild(levelText);

            resultContent.appendChild(resultPetal);
        }
    } else {
        const usedCount = result.total_used || totalPetalCount;
        const failMsg = document.createElement('p');
        failMsg.textContent = `合成失败! 使用了 ${usedCount} 个花瓣`;
        failMsg.style.color = '#ff4757';
        resultContent.appendChild(failMsg);

        if (result.remaining_count > 0) {
            const remainingText = document.createElement('p');
            remainingText.textContent = `剩余花瓣: ${result.remaining_count} 个`;
            remainingText.style.marginTop = '10px';
            resultContent.appendChild(remainingText);
        }
    }

    absorbResult.style.display = 'block';

    // 清空合成的花瓣
    if (result.total_used && result.total_used > 0) {
        clearSynthesizedPetals(result.total_used);
    } else {
        resetAbsorbSlots();
    }

    // 更新背包内容
    setTimeout(() => {
        if (gameState.connected) {
            sendToServer({
                COMMAND: 'REFRESH_BUILD',
                client_name: gameState.playerName,
                id: gameState.playerId
            });
        }
    }, 2000);
}

// 修改处理合成结果的函数（现在用于处理服务器响应）
function handleAbsorbResult(result) {
    // 如果动画还在进行，缓存结果等待动画结束
    if (gameState.isAbsorbing) {
        gameState.cachedAbsorbResult = result;
        return;
    }

    // 动画已结束，直接显示结果
    displayActualResult(result, result.total_used || 0);
}


// 重置合成槽位
function resetAbsorbSlots() {
    gameState.absorbSlots = Array(5).fill(null);
    gameState.absorbTotalCount = 0;
    gameState.currentAbsorbType = null;
    gameState.currentAbsorbLevel = null;
    initializeAbsorbSlots();
    updateAbsorbPetalSelection();
}


// 获取上一个房间
function getPreviousRoom() {
    res = gameState.previousRoom || 0;
    if (gameState.hasSelectedRoom) {
        gameState.previousRoom = gameState.currentRoom;
    }
    // 这里可以记录上一个房间
    return res
}

// 更新房间信息显示
function updateRoomInfo() {
    if (gameState.hasSelectedRoom) {
        roomInfo.querySelector('h3').textContent = `房间信息 - 房间 ${gameState.currentRoom + 1}`;
        updateRoomPlayers();
    } else {
        roomInfo.querySelector('h3').textContent = '房间信息 - 未选择房间';
        roomPlayers.innerHTML = '<div style="color: #666;">请先选择一个房间</div>';
    }

    // 如果当前在房间频道，更新聊天标题
    if (gameState.chatType === 'room') {
        updateChatTitle();
    }
}

// 更新房间内玩家显示
function updateRoomPlayers() {
    roomPlayers.innerHTML = '';

    // 首先添加当前玩家（总是显示在第一个）
    const currentPlayerBuild = gameState.equippedPetals.map(petal => {
        return petal ? [petal.type, petal.level] : [-1, 0];
    });
    addPlayerCard(gameState.playerName, currentPlayerBuild, true);

    // 添加其他玩家（从服务器数据中获取）
    if (gameState.hasSelectedRoom && gameState.roomPlayers[gameState.currentRoom]) {
        gameState.roomPlayers[gameState.currentRoom].forEach(player => {
            // 如果玩家ID与当前玩家ID相同，则不显示（因为已经在第一个显示过了）
            if (player.id !== gameState.playerId) {
                addPlayerCard(player.name, player.build, false);
            }
        });
    }
}

// 添加玩家卡片
function addPlayerCard(name, build, isCurrentPlayer) {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card';
    if (isCurrentPlayer) {
        playerCard.classList.add('current-player');
    }

    const playerName = document.createElement('div');
    playerName.className = 'player-name';
    playerName.textContent = isCurrentPlayer ? `${name} (你)` : name;
    playerCard.appendChild(playerName);

    const playerBuild = document.createElement('div');
    playerBuild.className = 'player-build';

    // 显示玩家的花瓣装备
    if (build && build.length > 0) {
        build.forEach((petal, index) => {
            // 检查花瓣是否有效（类型不为-1）
            if (petal && Array.isArray(petal) && petal.length >= 2 && petal[0] !== -1) {
                const petalType = petal[0];
                const petalLevel = petal[1];

                const petalIcon = document.createElement('div');
                petalIcon.className = 'petal-icon';

                // 获取花瓣图片
                const imgName = getPetalImageName(petalType, petalLevel);
                if (gameState.petalImages[imgName]) {
                    const img = document.createElement('img');
                    img.src = imgName;
                    img.alt = `类型: ${petalType}, 等级: ${petalLevel}`;
                    petalIcon.appendChild(img);

                    // 添加等级徽章
                    const levelBadge = document.createElement('div');
                    levelBadge.className = 'petal-level-badge';
                    levelBadge.textContent = petalLevel;
                    petalIcon.appendChild(levelBadge);
                } else {
                    // 如果没有图片，显示文字
                    petalIcon.textContent = `${petalType}-${petalLevel}`;
                    petalIcon.style.fontSize = '8px';
                }

                petalIcon.title = `类型: ${petalType}, 等级: ${petalLevel}`;
                playerBuild.appendChild(petalIcon);
            }
        });

        // 如果没有有效的花瓣，显示提示
        if (playerBuild.children.length === 0) {
            const noPetalMsg = document.createElement('div');
            noPetalMsg.textContent = '无装备';
            noPetalMsg.style.fontSize = '10px';
            noPetalMsg.style.color = 'rgba(255, 255, 255, 0.5)';
            playerBuild.appendChild(noPetalMsg);
        }
    } else {
        // 如果没有装备花瓣，显示提示
        const noPetalMsg = document.createElement('div');
        noPetalMsg.textContent = '无装备';
        noPetalMsg.style.fontSize = '10px';
        noPetalMsg.style.color = 'rgba(255, 255, 255, 0.5)';
        playerBuild.appendChild(noPetalMsg);
    }

    playerCard.appendChild(playerBuild);
    roomPlayers.appendChild(playerCard);
}



// 加载资源
function loadResources() {
    gameState.totalResources = resources.length;
    gameState.loadedResources = 0;

    resources.forEach(resource => {
        const img = new Image();
        img.onload = () => {
            gameState.loadedResources++;
            const progress = (gameState.loadedResources / gameState.totalResources) * 100;
            progressFill.style.width = `${progress}%`;
            loadingText.textContent = `${Math.round(progress)}%`;

            if (gameState.loadedResources === gameState.totalResources) {
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        };
        img.onerror = () => {
            console.error(`Failed to load resource: ${resource}`);
            gameState.loadedResources++;
        };
        img.src = resource;
        gameState.petalImages[resource] = img;
    });
}

// 根据花瓣类型和等级获取正确的图片文件名
function getPetalImageName(type, level) {
    // 如果类型为-1（未装备），返回默认图片
    if (type === -1) {
        return 'none.png';
    }

    try {
        // 将类型和等级转换为两位数字符串
        const typeStr = type.toString();
        const levelStr = level.toString();

        // 查找匹配的图片
        for (const resource of resources) {
            if (resource.startsWith(typeStr) && resource.endsWith('.png')) {
                // 检查是否是完全匹配（类型+等级的长度可能是4位或5位）
                const expectedName = typeStr + levelStr;
                if (resource.replace('.png', '') === expectedName) {
                    return resource;
                }
            }
        }

        // 如果没有找到完全匹配的，尝试找到类型匹配的
        for (const resource of resources) {
            if (resource.startsWith(typeStr) && resource.endsWith('.png')) {
                return resource;
            }
        }
    } catch (error) {
        console.error('获取花瓣图片名称时出错:', error, '类型:', type, '等级:', level);
    }

    // 如果还是没有找到，返回默认图片
    return 'none.png';
}


// 根据对象名称获取正确的图片
function getObjectImage(obj) {
    if (obj.name.includes('petal')) {
        // 对于花瓣，使用类型和等级获取图片
        const matches = obj.name.match(/\d+/g);
        if (matches && matches.length >= 2) {
            const type = parseInt(matches[0]);
            const level = parseInt(matches[1]);
            return getPetalImageName(type, level);
        }
        return 'none.png';
    }
    else return obj.name + '.png';
}

// 显示大厅界面
function showLobby() {
    gameState.playerName = playerNameInput.value || 'Player';
    startButton.style.display = 'none';
    playerNameInput.style.display = 'none';
    lobbyUI.style.display = 'flex';

    // 初始化装备槽
    initializeEquipmentSlots();

    // 初始化可用花瓣
    initializeAvailablePetals();

    // 更新房间信息
    updateRoomInfo();
}

// 初始化装备槽
function initializeEquipmentSlots() {
    equipmentSlots.innerHTML = '';
    for (let i = 0; i < gameState.equipmentSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'equipment-slot';
        slot.dataset.index = i;

        // 添加拖拽事件监听
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragenter', handleDragEnter);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);

        // 添加提示文本
        const hint = document.createElement('div');
        hint.textContent = i + 1;
        hint.style.color = 'rgba(255, 255, 255, 0.5)';
        hint.style.fontSize = '12px';
        slot.appendChild(hint);

        equipmentSlots.appendChild(slot);
    }
}

// 初始化可用花瓣
function initializeAvailablePetals() {
    // 保存当前合成槽状态
    const currentSlots = [...gameState.absorbSlots];
    const currentTotal = gameState.absorbTotalCount;

    // 模拟一些花瓣数据
    if (gameState.serverBuild) {
        gameState.availablePetals = parseServerBuild(gameState.serverBuild);

        // 减去合成槽中已占用的花瓣数量
        adjustAvailablePetalsForAbsorbSlots();
    }

    // 恢复合成槽状态（防止被覆盖）
    gameState.absorbSlots = currentSlots;
    gameState.absorbTotalCount = currentTotal;

    // 初始化背包内容
    initializeBagContent();
}

// 调整可用花瓣数量，考虑合成槽中的花瓣
function adjustAvailablePetalsForAbsorbSlots() {
    // 统计合成槽中每种花瓣占用的数量
    const absorbSlotCounts = {};

    gameState.absorbSlots.forEach(slot => {
        if (slot && slot.count > 0) {
            const key = `${slot.type}-${slot.level}`;
            absorbSlotCounts[key] = (absorbSlotCounts[key] || 0) + slot.count;
        }
    });

    // 从可用花瓣中减去占用的数量
    gameState.availablePetals.forEach(petal => {
        const key = `${petal.type}-${petal.level}`;
        if (absorbSlotCounts[key]) {
            petal.count = Math.max(0, petal.count - absorbSlotCounts[key]);
        }
    });

    console.log('调整后的可用花瓣（已减去合成槽占用）:', gameState.availablePetals);
}

// 拖拽开始处理
function handleDragStart(e) {
    const petalItem = e.target.closest('.petal-item');
    if (!petalItem) return;

    const index = petalItem.dataset.index;
    e.dataTransfer.setData('text/plain', index);
    petalItem.classList.add('dragging');
}

// 拖拽结束处理
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 拖拽经过处理
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('equipment-slot')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    if (e.target.classList.contains('equipment-slot')) {
        e.target.classList.remove('drag-over');
    }
}

// 拖拽放下处理
function handleDrop(e) {
    e.preventDefault();

    // 移除所有拖拽样式
    document.querySelectorAll('.equipment-slot.drag-over').forEach(slot => {
        slot.classList.remove('drag-over');
    });

    const petalIndex = e.dataTransfer.getData('text/plain');
    const slotElement = e.target.closest('.equipment-slot');

    if (!slotElement) return;

    const slotIndex = slotElement.dataset.index;

    if (petalIndex !== '' && slotIndex !== undefined) {
        equipPetal(parseInt(petalIndex), parseInt(slotIndex));
    }

    // 移除拖拽样式
    const draggingElement = document.querySelector('.petal-item.dragging');
    if (draggingElement) {
        draggingElement.classList.remove('dragging');
    }


    sendToServer({
        COMMAND: 'CHANGEBUILD',
        client_name: gameState.playerName,
        build: gameState.equippedPetals.map(petal => {
            return petal ? [petal.type, petal.level] : [-1, 0];
        }),
        room_id: gameState.currentRoom,
        id: gameState.playerId
    });
}

function parseServerBuild(buildData) {
    const availablePetals = [];

    // 遍历petal0到petal10（共11种花瓣类型）
    for (let i = 0; i < 11; i++) {
        const petalKey = `petal${i}`;
        const petalString = buildData[petalKey];

        if (petalString && petalString.length === 28) {
            const petalType = i; // petal0对应类型0（missile），以此类推

            // 每4个数字表示一个等级的花瓣数量，共7个等级
            for (let level = 1; level <= 7; level++) {
                const startIndex = (level - 1) * 4;
                const countStr = petalString.substring(startIndex, startIndex + 4);
                const count = parseInt(countStr, 10);

                // 只有当数量大于0时才添加到可用花瓣中
                if (count > 0) {
                    availablePetals.push({
                        type: petalType,
                        level: level,
                        count: count
                    });
                }
            }
        }
    }

    console.log('从服务器解析的花瓣数据:', availablePetals);
    return availablePetals;
}


function updateInventoryDisplay() {
    const inventory = document.getElementById('inventory');
    inventory.innerHTML = '';

    // 显示装备的花瓣
    gameState.equippedPetals.forEach((petal, index) => {
        const slot = document.createElement('div');
        slot.className = 'inventorySlot';

        if (petal) {
            // 如果有装备的花瓣，显示花瓣信息
            const imgName = getPetalImageName(petal.type, petal.level);
            if (gameState.petalImages[imgName]) {
                const img = document.createElement('img');
                img.src = imgName;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                slot.appendChild(img);
            } else {
                slot.textContent = `${petal.type}-${petal.level}`;
            }
            slot.title = `类型: ${petal.type}, 等级: ${petal.level}`;
        } else {
            // 如果没有装备花瓣，显示空槽位
            slot.textContent = index + 1;
            slot.style.color = 'rgba(255, 255, 255, 0.5)';
        }

        inventory.appendChild(slot);
    });
}

// 装备花瓣
function equipPetal(petalIndex, slotIndex) {
    if (petalIndex >= 0 && petalIndex < gameState.availablePetals.length &&
        slotIndex >= 0 && slotIndex < gameState.equipmentSlots) {

        const petal = gameState.availablePetals[petalIndex];

        // 检查花瓣数量是否足够
        if (petal.count <= 0) {
            alert('该花瓣数量不足!');
            return;
        }

        gameState.equippedPetals[slotIndex] = {...petal};

        // 更新UI
        const slot = equipmentSlots.querySelector(`.equipment-slot[data-index="${slotIndex}"]`);
        slot.innerHTML = '';
        slot.classList.add('equipped');

        // 获取正确的图片名称
        const imgName = getPetalImageName(petal.type, petal.level);

        if (gameState.petalImages[imgName]) {
            const img = document.createElement('img');
            img.src = imgName;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            slot.appendChild(img);
        } else {
            slot.textContent = `${petal.type}-${petal.level}`;
            slot.style.fontSize = '14px';
            slot.style.color = 'white';
        }

        // 减少可用花瓣数量
        petal.count--;

        // 更新背包UI
        updateBagContent();
        updateRoomPlayers();
    }
}

// 显示窗口
function showWindow(type) {
    if (type === 'bag') {
        bagWindow.style.display = 'block';
    } else if (type === 'absorb') {
        absorbWindow.style.display = 'block';
    } else if (type === 'gallery') {
        galleryWindow.style.display = 'block';
    }
}

// 隐藏窗口
function hideWindow(type) {
    if (type === 'bag') {
        bagWindow.style.display = 'none';
    } else if (type === 'absorb') {
        absorbWindow.style.display = 'none';
    } else if (type === 'gallery') {
        galleryWindow.style.display = 'none';
    }
}

// 初始化背包内容
function initializeBagContent() {
    const bagContent = document.getElementById('bagContent');
    bagContent.innerHTML = '';

    // 按花瓣类型分组
    const petalsByType = {};

    gameState.availablePetals.forEach((petal, index) => {
        if (!petalsByType[petal.type]) {
            petalsByType[petal.type] = [];
        }
        petalsByType[petal.type].push({...petal, originalIndex: index});
    });

    // 按类型排序并显示
    Object.keys(petalsByType).sort((a, b) => parseInt(a) - parseInt(b)).forEach(type => {
        const petals = petalsByType[type];

        // 创建行容器
        const row = document.createElement('div');
        row.className = 'petal-row';

        // 添加类型标题
        const typeHeader = document.createElement('div');
        typeHeader.className = 'petal-type-header';
        typeHeader.textContent = `类型 ${type} 花瓣`;
        row.appendChild(typeHeader);

        // 按等级排序
        petals.sort((a, b) => a.level - b.level).forEach(petal => {
            const item = document.createElement('div');
            item.className = 'petal-item';
            item.draggable = true;
            item.dataset.index = petal.originalIndex;
            item.title = `类型: ${petal.type}, 等级: ${petal.level}, 数量: ${petal.count}`;

            // 获取正确的图片名称
            const imgName = getPetalImageName(petal.type, petal.level);

            // 尝试加载图片，如果没有则显示文本
            if (gameState.petalImages[imgName]) {
                const img = document.createElement('img');
                img.src = imgName;
                img.style.maxWidth = '80%';
                img.style.maxHeight = '80%';
                img.onerror = function() {
                    // 如果图片加载失败，显示文本
                    item.textContent = `${petal.type}-${petal.level}`;
                    item.style.fontSize = '10px';
                };
                item.appendChild(img);
            } else {
                item.textContent = `${petal.type}-${petal.level}`;
                item.style.fontSize = '10px';
            }

            // 添加等级标签
            const levelBadge = document.createElement('div');
            levelBadge.className = 'petal-level';
            levelBadge.textContent = `Lv.${petal.level}`;
            item.appendChild(levelBadge);

            // 添加数量标签
            const countBadge = document.createElement('div');
            countBadge.className = 'petal-count';
            countBadge.textContent = petal.count;
            item.appendChild(countBadge);

            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            row.appendChild(item);
        });

        bagContent.appendChild(row);
    });
}

// 更新背包内容
function updateBagContent() {
    const bagContent = document.getElementById('bagContent');
    bagContent.innerHTML = '';

    // 按花瓣类型分组
    const petalsByType = {};

    gameState.availablePetals.forEach((petal, index) => {
        if (petal.count > 0) {
            if (!petalsByType[petal.type]) {
                petalsByType[petal.type] = [];
            }
            petalsByType[petal.type].push({...petal, originalIndex: index});
        }
    });

    // 按类型排序并显示
    Object.keys(petalsByType).sort((a, b) => parseInt(a) - parseInt(b)).forEach(type => {
        const petals = petalsByType[type];

        // 创建行容器
        const row = document.createElement('div');
        row.className = 'petal-row';

        // 添加类型标题
        const typeHeader = document.createElement('div');
        typeHeader.className = 'petal-type-header';
        typeHeader.textContent = `类型 ${type} 花瓣`;
        row.appendChild(typeHeader);

        // 按等级排序
        petals.sort((a, b) => a.level - b.level).forEach(petal => {
            const item = document.createElement('div');
            item.className = 'petal-item';
            item.draggable = true;
            item.dataset.index = petal.originalIndex;
            item.title = `类型: ${petal.type}, 等级: ${petal.level}, 数量: ${petal.count}`;

            // 获取正确的图片名称
            const imgName = getPetalImageName(petal.type, petal.level);

            // 尝试加载图片，如果没有则显示文本
            if (gameState.petalImages[imgName]) {
                const img = document.createElement('img');
                img.src = imgName;
                img.style.maxWidth = '80%';
                img.style.maxHeight = '80%';
                img.onerror = function() {
                    // 如果图片加载失败，显示文本
                    item.textContent = `${petal.type}-${petal.level}`;
                    item.style.fontSize = '10px';
                };
                item.appendChild(img);
            } else {
                item.textContent = `${petal.type}-${petal.level}`;
                item.style.fontSize = '10px';
            }

            // 添加等级标签
            const levelBadge = document.createElement('div');
            levelBadge.className = 'petal-level';
            levelBadge.textContent = `Lv.${petal.level}`;
            item.appendChild(levelBadge);

            // 添加数量标签
            const countBadge = document.createElement('div');
            countBadge.className = 'petal-count';
            countBadge.textContent = petal.count;
            item.appendChild(countBadge);

            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            row.appendChild(item);
        });

        bagContent.appendChild(row);
    });
}


// 准备游戏
function readyToPlay() {
    if (!gameState.connected) {
        connectToServer();
    } else {
        // 发送准备消息
        sendToServer({
            COMMAND: 'PLAY',
            client_name: gameState.playerName,
            build: gameState.equippedPetals.map(petal => {
                return petal ? [petal.type, petal.level] : [-1, 0];
            }),
            room_id: gameState.currentRoom,
            id: gameState.playerId
        });

        readyButton.textContent = '取消准备';
        readyButton.style.backgroundColor = '#f44336'; // 红色背景
    }
}

// 取消准备
function cancelReady() {
    if (gameState.connected) {
        // 发送取消准备消息
        sendToServer({
            COMMAND: 'CANCEL_READY',
            client_name: gameState.playerName,
            id: gameState.playerId,
            room_id: gameState.currentRoom
        });

        readyButton.textContent = 'Ready';
        readyButton.style.backgroundColor = '#4CAF50'; // 绿色背景
    }
}

// 开始游戏
function startGame() {
    lobbyUI.style.display = 'none';
    startScreen.style.display = 'none';
    gameState.isLobby = false;
    updateInventoryDisplay();
    waveBar.style.display = 'block';

    // 开始播放背景音乐
    startBackgroundMusic();
}

// 重新开始游戏
function restartGame() {
    gameOverScreen.style.display = 'none';
    gameState.playerHealth = gameState.playerMaxHealth;
    gameState.isLobby = true;
    lobbyUI.style.display = 'flex';
    startScreen.style.display = 'flex';
    readyButton.disabled = false;
    readyButton.textContent = 'Ready';
    readyButton.style.backgroundColor = '#4CAF50'; // 重置为绿色
    waveBar.style.display = 'none';

    // 停止背景音乐
    stopBackgroundMusic();

    // 重新连接服务器以启动心跳
    if (!gameState.connected) {
        connectToServer();
    }
}

// 连接到服务器
function connectToServer() {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) {
        gameState.playerId = parseInt(storedPlayerId);
        console.log('使用本地存储的玩家ID:', gameState.playerId);
    }
    try {
        gameState.socket = new WebSocket(config.serverAddress);

        gameState.socket.onopen = () => {
            console.log('连接到服务器成功');
            gameState.connected = true;

            // 发送连接消息
            sendToServer({
                COMMAND: 'CONNECT',
                client_name: gameState.playerName,
                id: gameState.playerId
            });

            // 启动心跳机制 - 每10秒发送一次心跳包
            startHeartbeat();


        };

        gameState.socket.onmessage = (event) => {
            handleServerMessage(event.data);
        };

        gameState.socket.onerror = (error) => {
            console.error('WebSocket错误:', error);
            gameState.connected = false;
            // 停止心跳
            stopHeartbeat();
        };

        gameState.socket.onclose = () => {
            console.log('与服务器断开连接');
            gameState.connected = false;
            // 停止心跳
            stopHeartbeat();
        };
    } catch (error) {
        console.error('连接服务器失败:', error);
    }
}

function startHeartbeat() {
    // 清除可能存在的旧心跳定时器
    if (gameState.heartbeatInterval) {
        clearInterval(gameState.heartbeatInterval);
    }

    // 设置新的心跳定时器，每10秒发送一次心跳包
    gameState.heartbeatInterval = setInterval(() => {
        if (gameState.connected && gameState.socket.readyState === WebSocket.OPEN) {
            sendToServer({
                COMMAND: 'HEARTBEAT',
                client_name: gameState.playerName,
                id: gameState.playerId,
                timestamp: Date.now()
            });
            console.log('发送心跳包');
        }
    }, 10000); // 10秒 = 10000毫秒
}

// 停止心跳包
function stopHeartbeat() {
    if (gameState.heartbeatInterval) {
        clearInterval(gameState.heartbeatInterval);
        gameState.heartbeatInterval = null;
        console.log('停止心跳包');
    }
}

// 处理服务器消息
function handleServerMessage(data) {
    try {
        const message = JSON.parse(data);

        switch(message.cmd) {
            case 'ABSORB_RESULT':
                handleAbsorbResult(message);
                break;
            case 'build': // 新用户，服务端分配了新ID
                if (message.id !== undefined) {
                    // 存储ID到localStorage
                    gameState.playerId = message.id;
                    localStorage.setItem('playerId', gameState.playerId);
                    console.log('新用户，分配ID:', gameState.playerId);

                    // 处理初始数据（如果有）
                    if (message.level !== undefined) {
                        // 处理等级等初始数据
                    }

                    // 处理花瓣数据
                    if (message.petal0 !== undefined) {
                        gameState.serverBuild = message;
                        console.log('收到服务器bag信息:', message);

                    // 如果在大厅界面，更新可用花瓣
                    if (gameState.isLobby) {
                        initializeAvailablePetals();
                        updateAbsorbPetalSelection();
                    }}
                }
                break;

            case 'BUILD': // 已有用户，服务端返回了用户数据
                if (message.id !== undefined) {
                    gameState.playerId = message.id;
                    // 确保localStorage中的ID是最新的
                    localStorage.setItem('playerId', gameState.playerId);
                    console.log('已有用户，ID:', gameState.playerId);

                    // 处理用户数据
                    if (message.level !== undefined) {
                        // 处理等级数据
                    }

                    // 处理花瓣数据
                    if (message.petal0 !== undefined) {
                        gameState.serverBuild = message;
                        console.log('收到服务器bag信息:', message);

                    // 如果在大厅界面，更新可用花瓣
                        if (gameState.isLobby) {
                            initializeAvailablePetals();
                            updateAbsorbPetalSelection();
                        }
                    }
                }
                break;
            case 'BOUNDARY_INFO':
                gameState.boundaryRadius = message.radius;
                console.log('Received boundary radius:', message.radius);
                break;

            case 'ROOM_INFO':
                // 处理房间信息
                if (gameState.hasSelectedRoom && gameState.currentRoom !== null) {
                    gameState.roomPlayers[gameState.currentRoom] = [];
                    for (const playerId in message.data) {
                        const player = message.data[playerId];
                        gameState.roomPlayers[gameState.currentRoom].push({
                        id: playerId, // 存储玩家ID
                        name: player.name || playerId, // 使用服务器提供的名字或玩家ID作为名字
                        build: player.build || []
                    });
                    }
                    updateRoomPlayers();
                }
                break;

            case 'START_GAME':
                // 开始游戏
                startGame();
                break;



            case 'GAME_DATA':
                // 处理游戏数据
                if (message.health !== undefined) {
                    const previousHealth = gameState.playerHealth;
                    gameState.playerHealth = message.health;
                    gameState.playerMaxHealth = message.maxhealth;
                    updateHealthBar();

                    // 检查玩家是否死亡
                    if (previousHealth > 0 && message.health <= 0) {
                        playDeathSound();
                        stopBackgroundMusic();
                    }
                }

                if (message.Myflower) {
                    gameState.playerPosition = {
                        x: message.Myflower[1][0],
                        y: message.Myflower[1][1]
                    };
                }

                if (message.petals) {
                    gameState.petals = message.petals.map(petal => ({
                        name: petal[0],
                        position: { x: petal[1][0], y: petal[1][1] },
                        angle: petal[2],
                        level: petal[3],
                        size: petal[4]
                    }));
                }
                if (message.wave) {
                    updateWaveBar(message.wave);
                }

                if (message.mobs) {
                        gameState.mobs = message.mobs.map(mob => {
                            // 创建基础的怪物对象
                            const mobObject = {
                                name: mob[0],
                                position: { x: mob[1][0], y: mob[1][1] },
                                angle: mob[2],
                                level: mob[3],
                                size: mob[4]
                            };

                            // 特殊处理：如果怪物名称是 centipede0，将大小变为1.5倍
                            if (mob[0] === 'centipede0') {
                                mobObject.size = [mob[4][0] * 1.2, mob[4][1] * 1.2];
                            }
                            return mobObject;
                        });
                }

                if (message.flowers) {
                    gameState.flowers = message.flowers.map(flower => ({
                        name: flower[0],
                        position: { x: flower[1][0], y: flower[1][1] },
                        angle: flower[2],
                        level: flower[3],
                        size: flower[4]
                    }));
                }

                if (message.collectDrop) {
                    gameState.collectDrops = message.collectDrop.map(drop => ({
                        name: drop[0],
                        position: { x: drop[1][0], y: drop[1][1] },
                        angle: drop[2],
                        level: drop[3],
                        size: [drop[4][0]*2, drop[4][1]*2]
                    }));
                }

                if (message.effects) {
                    // 为每个特效添加开始时间
                    message.effects.forEach(effect => {
                        effect.startTime = Date.now() / 1000;
                    });
                    // 将新特效添加到现有特效列表
                    gameState.effects = gameState.effects.concat(message.effects);
                }


                // 检查游戏结束
                if (gameState.playerHealth <= 0) {
                    gameOverScreen.style.display = 'flex';
                }
                break;

            case 'CHAT_HISTORY':
                handleChatHistory(message.messages);
                break;

            case 'CHAT_MESSAGE':
                handleChatMessage(message.message);
                break;

            case 'CHAT_ERROR':
                addChatMessage('错误', message.error, 'error');
                break;

            case 'CHAT_CLEAR':
                clearChatMessages();
                break;

            default:
                console.log('Unknown message:', message);
                break;
        }
    } catch (error) {
        console.error('解析服务器消息失败:', error);
    }
}

// 发送消息到服务器
function sendToServer(data) {
    if (gameState.connected && gameState.socket.readyState === WebSocket.OPEN) {
        gameState.socket.send(JSON.stringify(data));
    }
}

// 更新血条
function updateHealthBar() {
    const healthPercent = Math.max(0, gameState.playerHealth / gameState.playerMaxHealth);
    healthFill.style.width = `${healthPercent * 100}%`;
}

// 处理鼠标移动
function handleMouseMove(event) {
    if (!gameState.connected || gameState.isLobby) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 计算相对于玩家中心的位置
    const playerCenterX = canvas.width / 2;
    const playerCenterY = canvas.height / 2;

    const relativeX = mouseX - playerCenterX;
    const relativeY = mouseY - playerCenterY;

    // 计算角度
    gameState.playerAngle = Math.atan2(relativeY, relativeX);

    // 发送鼠标位置到服务器
    sendToServer({
        COMMAND: 'SEND_DATA',
        client_name: gameState.playerName,
        data: [relativeX, relativeY, gameState.playerState],
        id: gameState.playerId
    });
}

// 处理鼠标按下
function handleMouseDown(event) {
    if (!gameState.connected || gameState.isLobby) return;

    if (event.button === 0) { // 左键
        gameState.playerState = 1; // 攻击
    } else if (event.button === 2) { // 右键
        gameState.playerState = -1; // 防御
    }

    // 发送状态到服务器
    sendToServer({
        COMMAND: 'SEND_DATA',
        client_name: gameState.playerName,
        data: [0, 0, gameState.playerState],
        id: gameState.playerId
    });
}

// 处理鼠标释放
function handleMouseUp(event) {
    if (!gameState.connected || gameState.isLobby) return;

    gameState.playerState = 0; // 正常状态

    // 发送状态到服务器
    sendToServer({
        COMMAND: 'SEND_DATA',
        client_name: gameState.playerName,
        data: [0, 0, gameState.playerState],
        id: gameState.playerId
    });
}

// 游戏主循环
function gameLoop(timestamp) {
    // 计算FPS
    if (gameState.lastFrameTime) {
        const delta = timestamp - gameState.lastFrameTime;
        gameState.fps = Math.round(1000 / delta);
        fpsDisplay.textContent = `FPS: ${gameState.fps}`;
    }
    gameState.lastFrameTime = timestamp;

    // 清除画布
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 如果不是大厅模式，绘制游戏内容
    if (!gameState.isLobby) {
        // 绘制背景元素
        drawBackground();

        // 绘制游戏对象
        drawGameObjects();

        // 绘制玩家
        drawPlayer();

        // 绘制特效
        drawEffects();
    }

    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 绘制背景
function drawBackground() {
    // 绘制简单的背景网格
    ctx.strokeStyle = 'rgba(0, 100, 0, 1)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    const offsetX = gameState.playerPosition.x % gridSize;
    const offsetY = gameState.playerPosition.y % gridSize;

    for (let x = -offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = -offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    // 绘制游戏边界
    if (gameState.boundaryRadius > 0) {
        const playerCenterX = canvas.width / 2;
        const playerCenterY = canvas.height / 2;

        // 计算边界在屏幕上的位置
        const boundaryX = playerCenterX - gameState.playerPosition.x;
        const boundaryY = playerCenterY - gameState.playerPosition.y;

        ctx.beginPath();
        ctx.arc(boundaryX, boundaryY, gameState.boundaryRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 绘制边界中心点标记
        ctx.beginPath();
        ctx.arc(boundaryX, boundaryY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fill();
    }
}

// 绘制游戏对象
function drawGameObjects() {
    // 绘制收集物
    gameState.collectDrops.forEach(drop => {
        drawObject(drop);
    });

    // 绘制花瓣
    gameState.petals.forEach(petal => {
        drawObject(petal);
    });

    // 绘制怪物
    gameState.mobs.forEach(mob => {
        drawObject(mob);
    });

    // 绘制其他花朵
    gameState.flowers.forEach(flower => {
        flower.angle = 0
        drawObject(flower);
    });
}

// 绘制单个对象
function drawObject(obj) {
    const playerCenterX = canvas.width / 2;
    const playerCenterY = canvas.height / 2;

    // 计算对象在屏幕上的位置
    const screenX = playerCenterX + (obj.position.x - gameState.playerPosition.x);
    const screenY = playerCenterY + (obj.position.y - gameState.playerPosition.y);

    // 获取对象对应的图片
    const imageName = getObjectImage(obj);
    const image = gameState.petalImages[imageName];

    if (image) {
        // 绘制图片
        ctx.save();
        ctx.translate(screenX, screenY);
        if (imageName != 'flower.png'){
            ctx.rotate(-obj.angle * Math.PI / 180); // 旋转角度
        }


        // 根据对象的大小调整图片尺寸
        const width = obj.size[0] || 30;
        const height = obj.size[1] || 30;
        ctx.drawImage(image, -width/2, -height/2, width, height);
        ctx.restore();
    } else {
        // 如果没有图片，则绘制默认形状
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(obj.angle * Math.PI / 180);

        // 根据对象类型选择颜色
        let color = '#FF6B6B'; // 默认红色
        if (obj.name.includes('hornet')) color = '#9B59B6'; // 紫色
        if (obj.name.includes('centipede')) color = '#8E44AD'; // 深紫色
        if (obj.name.includes('rock')) color = '#7F8C8D'; // 灰色
        if (obj.name.includes('ladybug')) color = '#E74C3C'; // 红色
        if (obj.name.includes('flower')) color = '#3498DB'; // 蓝色

        ctx.fillStyle = color;
        ctx.beginPath();

        if (obj.name.includes('hornet')) {
            // 绘制大黄蜂形状
            ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
        } else if (obj.name.includes('centipede')) {
            // 绘制蜈蚣形状
            ctx.rect(-width/2, -height/2, width, height);
        } else if (obj.name.includes('rock')) {
            // 绘制岩石形状
            ctx.rect(-width/2, -height/2, width, height);
        } else if (obj.name.includes('ladybug')) {
            // 绘制瓢虫形状
            ctx.arc(0, 0, width/2, 0, Math.PI * 2);
        } else if (obj.name.includes('petal')) {
            // 绘制花瓣形状
            ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
        } else {
            // 默认圆形
            ctx.arc(0, 0, width/2, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.restore();
    }
}

// 绘制玩家
function drawPlayer() {
    const playerCenterX = canvas.width / 2;
    const playerCenterY = canvas.height / 2;

    // 获取玩家花朵图片
    const playerImage = gameState.petalImages['flower.png'];

    if (playerImage) {
        // 绘制玩家花朵图片
        ctx.save();
        ctx.translate(playerCenterX, playerCenterY);
        ctx.rotate(gameState.playerAngle);

        ctx.drawImage(
            playerImage,
            -config.playerSize/2,
            -config.playerSize/2,
            config.playerSize,
            config.playerSize
        );

        // 绘制玩家状态指示器
        if (gameState.playerState === 1) {
            // 攻击状态 - 红色光环
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, config.playerSize/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (gameState.playerState === -1) {
            // 防御状态 - 蓝色光环
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, config.playerSize/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    } else {
        // 如果没有图片，则绘制默认形状
        ctx.save();
        ctx.translate(playerCenterX, playerCenterY);

        // 绘制玩家花朵
        ctx.fillStyle = '#2ECC71'; // 绿色
        ctx.beginPath();
        ctx.arc(0, 0, config.playerSize/2, 0, Math.PI * 2);
        ctx.fill();

        // 绘制玩家状态指示器
        if (gameState.playerState === 1) {
            // 攻击状态 - 红色光环
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, config.playerSize/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (gameState.playerState === -1) {
            // 防御状态 - 蓝色光环
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, config.playerSize/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 绘制玩家方向指示器
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(gameState.playerAngle) * config.playerSize,
                  Math.sin(gameState.playerAngle) * config.playerSize);
        ctx.stroke();

        ctx.restore();
    }
}

// 设置画布大小
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function drawEffects() {
    const now = Date.now() / 1000;
    gameState.effects = gameState.effects.filter(effect => {
        const elapsed = now - effect.startTime;

        if (effect.type === 'poison') {
            // 中毒效果：增强版 - 深绿毒气云 + 发光骷髅
            if (elapsed < effect.duration) {
                const alpha = 1 - (elapsed / effect.duration);
                const screenX = canvas.width/2 + (effect.position[0] - gameState.playerPosition.x);
                const screenY = canvas.height/2 + (effect.position[1] - gameState.playerPosition.y);

                ctx.save();

                // 绘制毒气云背景（深绿色半透明圆）
                ctx.fillStyle = `rgba(0, 100, 0, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 35 + Math.sin(elapsed * 3) * 5, 0, Math.PI * 2);
                ctx.fill();

                // 绘制多层毒气粒子
                const particleCount = 8;
                const time = elapsed * 2;
                const angleStep = Math.PI * 2 / particleCount;

                for (let i = 0; i < particleCount; i++) {
                    const angle = angleStep * i + time;
                    const distance = 18 + Math.sin(time * 2 + i) * 8;
                    const px = screenX + Math.cos(angle) * distance;
                    const py = screenY + Math.sin(angle) * distance;

                    // 外层粒子
                    ctx.fillStyle = '#00FF00';
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fillRect(px - 3, py - 3, 6, 6);

                    // 内层亮绿色粒子
                    ctx.fillStyle = '#66FF66';
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.fillRect(px - 1, py - 1, 2, 2);
                }

                // 绘制发光骷髅图标
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00FF00';
                ctx.fillStyle = '#00FF00';
                ctx.globalAlpha = alpha * 0.9;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☠', screenX, screenY);

                ctx.restore();
                return true;
            }
        }
        else if (effect.type === 'lightning') {
            // 闪电效果：黄色折线，持续0.5秒
            if (elapsed < 0.5) {
                const alpha = 1 - (elapsed / 0.5);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#FFFF00';
                ctx.lineWidth = 4;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FFFF00';

                ctx.beginPath();
                effect.chain.forEach((pos, index) => {
                    const screenX = canvas.width/2 + (pos[0] - gameState.playerPosition.x);
                    const screenY = canvas.height/2 + (pos[1] - gameState.playerPosition.y);
                    if (index === 0) {
                        ctx.moveTo(screenX, screenY);
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                });
                ctx.stroke();
                ctx.restore();
                return true;
            }
        }
        else if (effect.type === 'explosion') {
            // 爆炸效果：增强版 - 强烈光线 + 少量大粒子
            if (elapsed < 1) {
                const progress = elapsed;
                const screenX = canvas.width/2 + (effect.position[0] - gameState.playerPosition.x);
                const screenY = canvas.height/2 + (effect.position[1] - gameState.playerPosition.y);

                ctx.save();

                // 中心闪光效果
                const flashSize = (1 - progress) * 40;
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, flashSize);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${(1 - progress) * 0.9})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 0, ${(1 - progress) * 0.7})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, flashSize, 0, Math.PI * 2);
                ctx.fill();

                // 强烈放射光线
                const rayCount = 8;
                const maxRayLength = effect.radius * 2;
                const angleStep = Math.PI * 2 / rayCount;

                for (let i = 0; i < rayCount; i++) {
                    const angle = angleStep * i;
                    const rayLength = maxRayLength * progress;
                    const endX = screenX + Math.cos(angle) * rayLength;
                    const endY = screenY + Math.sin(angle) * rayLength;

                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#FF6600';
                    ctx.strokeStyle = `rgba(255, ${150 + progress * 105}, 0, ${(1 - progress) * 0.8})`;
                    ctx.lineWidth = 5 * (1 - progress) + 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }

                // 少量大型火焰粒子
                const particleCount = 4;
                const colors = ['#FF0000', '#FF3300', '#FF6600', '#FFAA00'];

                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 / particleCount) * i + progress * 0.5;
                    const distance = effect.radius * progress * (0.6 + i * 0.2);
                    const px = screenX + Math.cos(angle) * distance;
                    const py = screenY + Math.sin(angle) * distance;
                    const size = (15 + Math.random() * 10) * (1 - progress * 0.7);

                    // 粒子发光效果
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = colors[i];
                    ctx.fillStyle = colors[i];
                    ctx.globalAlpha = (1 - progress) * 0.8;

                    // 绘制大粒子
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();

                    // 内部高光
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = (1 - progress) * 0.4;
                    ctx.beginPath();
                    ctx.arc(px - size/3, py - size/3, size/3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
                return true;
            }
        }
        return false; // 移除已结束的特效
    });
}




// ========== 聊天功能相关函数 ==========

// 初始化聊天功能
function initializeChat() {
    // 设置初始聊天标题
    updateChatTitle();

    // 聊天界面事件监听
    chatSendButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // 聊天类型切换
    chatTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            chatTypeButtons.forEach(btn => btn.classList.remove('active'));
            // 添加active类到当前按钮
            button.classList.add('active');
            // 更新聊天类型
            gameState.chatType = button.dataset.type;

            // 清空当前聊天显示
            chatMessages.innerHTML = '';

            // 加载对应类型的聊天历史
            loadChatHistory(gameState.chatType);

            // 更新聊天标题
            updateChatTitle();

            // 更新输入框提示
            updateChatPlaceholder();
        });
    });

    // 聊天窗口关闭
    chatClose.addEventListener('click', () => {
        gameState.isChatClosed = true;
        chatContainer.style.display = 'none';
        chatOpenButton.style.display = 'block';
    });

    // 重新打开聊天窗口
    chatOpenButton.addEventListener('click', () => {
        gameState.isChatClosed = false;
        chatContainer.style.display = 'flex';
        chatOpenButton.style.display = 'none';
    });
}

// 更新聊天标题
function updateChatTitle() {
    let title = '聊天';
    if (gameState.chatType === 'room') {
        if (gameState.hasSelectedRoom && gameState.currentRoom !== null) {
            title = `房间 ${gameState.currentRoom + 1}`;
        } else {
            title = '房间';
        }
    } else if (gameState.chatType === 'global') {
        title = '全局';
    } else if (gameState.chatType === 'private') {
        title = '私聊';
    }
    chatTitle.textContent = title;
}

// 更新聊天输入框提示
function updateChatPlaceholder() {
    if (gameState.chatType === 'private') {
        if (gameState.privateTarget) {
            chatInput.placeholder = `私聊 ${gameState.privateTarget}:`;
        } else {
            chatInput.placeholder = '私聊 /w <玩家名> <消息>';
        }
    } else {
        chatInput.placeholder = `输入${gameState.chatType === 'room' ? '房间' : '全局'}消息...`;
    }
}

// 发送聊天消息
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || !gameState.connected) return;

    // 检查是否在房间频道但没有选择房间
    if (gameState.chatType === 'room' && !gameState.hasSelectedRoom) {
        addChatMessage('system', '请先选择一个房间才能在房间频道发送消息', 'error');
        return;
    }

    // 检查是否是聊天命令
    if (message.startsWith('/')) {
        // 处理聊天命令
        sendToServer({
            COMMAND: 'CHAT_COMMAND',
            command: message,
            id: gameState.playerId
        });
        chatInput.value = '';
        return;
    }

    // 处理私聊命令
    if (message.startsWith('/w ') || message.startsWith('/whisper ')) {
        const parts = message.split(' ');
        if (parts.length >= 3) {
            const target = parts[1];
            const privateMessage = parts.slice(2).join(' ');

            sendToServer({
                COMMAND: 'CHAT_MESSAGE',
                message: privateMessage,
                type: 'private',
                target: target,
                id: gameState.playerId
            });
        }
        chatInput.value = '';
        return;
    }

    // 发送普通消息
    let messageType = gameState.chatType;
    let target = null;

    if (messageType === 'private') {
        if (!gameState.privateTarget) {
            addChatMessage('system', '请先选择私聊对象或使用 /w <玩家名> <消息> 命令', 'system');
            return;
        }
        target = gameState.privateTarget;
    }

    sendToServer({
        COMMAND: 'CHAT_MESSAGE',
        message: message,
        type: messageType,
        target: target,
        id: gameState.playerId
    });

    chatInput.value = '';
}

// 添加聊天消息到界面
function addChatMessage(playerName, message, type, timestamp = null) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}`;

    // 格式化时间戳
    const time = timestamp ? new Date(timestamp * 1000) : new Date();
    const timeString = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // 处理私聊消息格式
    if (type === 'private') {
        const isFromMe = playerName === gameState.playerName;
        if (isFromMe) {
            messageElement.innerHTML = `
                <span class="chat-player-name">你 -> ${message}</span>
                <span class="chat-timestamp">${timeString}</span>
            `;
        } else {
            messageElement.innerHTML = `
                <span class="chat-player-name">${playerName} -> 你:</span>
                <span>${message}</span>
                <span class="chat-timestamp">${timeString}</span>
            `;
        }
    } else {
        // 处理其他类型消息
        let displayName = playerName;
        if (type === 'system') {
            displayName = '系统';
        }

        messageElement.innerHTML = `
            <span class="chat-player-name">${displayName}${type !== 'system' ? ':' : ''}</span>
            <span>${message}</span>
            <span class="chat-timestamp">${timeString}</span>
        `;
    }

    chatMessages.appendChild(messageElement);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 限制消息数量
    if (chatMessages.children.length > 100) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

// 清空聊天界面
function clearChatMessages() {
    chatMessages.innerHTML = '';
}

// 加载指定类型的聊天历史
function loadChatHistory(chatType) {
    const history = gameState.chatHistory[chatType] || [];
    history.forEach(msg => {
        // 对于房间消息和系统消息，检查是否来自当前房间
        if (msg.type === 'room' || msg.type === 'system') {
            if (msg.room_id !== undefined && msg.room_id !== gameState.currentRoom) {
                return; // 跳过不属于当前房间的消息
            }
        }
        addChatMessage(msg.player_name, msg.message, msg.type, msg.timestamp);
    });
}

// 处理聊天历史
function handleChatHistory(messages) {
    clearChatMessages();
    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            // 对于房间消息和系统消息，检查是否来自当前房间
            if (msg.type === 'room' || msg.type === 'system') {
                if (msg.room_id !== undefined && msg.room_id !== gameState.currentRoom) {
                    return; // 跳过不属于当前房间的消息
                }
            }
            addChatMessage(msg.player_name, msg.message, msg.type, msg.timestamp);
        });
    }
}

// 处理服务器发送的聊天消息
function handleChatMessage(messageData) {
    // 调试信息：输出消息详情
    console.log('收到聊天消息:', messageData);
    console.log('当前房间:', gameState.currentRoom, '消息房间:', messageData.room_id, '消息类型:', messageData.type);

    // 将消息保存到对应类型的历史记录中
    if (messageData.type && gameState.chatHistory[messageData.type]) {
        gameState.chatHistory[messageData.type].push(messageData);

        // 限制历史记录数量
        if (gameState.chatHistory[messageData.type].length > 100) {
            gameState.chatHistory[messageData.type].shift();
        }
    }

    // 只有当消息类型与当前聊天类型匹配时才显示
    if (messageData.type !== gameState.chatType) {
        console.log('消息类型不匹配，跳过显示');
        return;
    }

    // 对于房间消息和系统消息，检查是否来自玩家当前所在的房间
    if (messageData.type === 'room' || messageData.type === 'system') {
        // 如果消息有房间ID且不匹配当前房间，则不显示
        if (messageData.room_id !== undefined && messageData.room_id !== gameState.currentRoom) {
            console.log('房间ID不匹配，跳过显示');
            return;
        }
    }

    if (messageData.type === 'private') {
        // 私聊消息
        const isFromMe = messageData.sender_id === gameState.playerId;
        const playerName = isFromMe ? '你' : messageData.sender_name;
        const message = isFromMe ? `-> ${messageData.target_name}: ${messageData.message}` : `-> 你: ${messageData.message}`;
        addChatMessage(playerName, message, 'private', messageData.timestamp);
    } else {
        // 其他消息
        addChatMessage(messageData.player_name, messageData.message, messageData.type, messageData.timestamp);
    }
}

// 初始化游戏
initGame();