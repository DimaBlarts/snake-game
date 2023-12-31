const gridSize = 15; // Увеличиваем размер сетки
const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
const cellSize = 20; // Размер каждой ячейки в пикселях


let snake = [{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }];
let food = generateFood();
let obstacles = [];
let lasers = [];
let animationFrameId;

let commands = [];
let direction = 'right';
let isTurning = false;
let isAccelerated = false; // Флаг для отслеживания ускорения
let foodInterval;

const initialSnakeSpeed = 300;
let snakeSpeed = initialSnakeSpeed; // Исходная скорость змейки
const acceleratedSnakeSpeed = snakeSpeed / 2; // Скорость змейки при ускорении
const laserSpeed = 150; // Уменьшаем скорость лазера

function generateFood() {
  const x = Math.floor(Math.random() * gridSize);
  const y = Math.floor(Math.random() * gridSize);
  return { x, y };
}

function updateGrid() {
  grid.forEach(row => row.fill(0));
  snake.forEach((segment, index) => {
    if (index === 0) {
      grid[segment.y][segment.x] = 2; // Голова змейки
    } else {
      grid[segment.y][segment.x] = 1; // Тело змейки
    }
  });
  obstacles.forEach(obstacle => {
    grid[obstacle.y][obstacle.x] = 4; // Препятствие
  });
  lasers.forEach(laser => {
    grid[laser.y][laser.x] = 5; // Лазер
  });
  grid[food.y][food.x] = 3; // Еда
}

function moveSnake() {
  const head = Object.assign({}, snake[0]);

  // Обрабатываем все накопленные команды
  while (commands.length > 0) {
    const nextCommand = commands.shift();

    switch (nextCommand) {
      case 'w':
        if (direction !== 'down') {
          direction = 'up';
        }
        break;
      case 's':
        if (direction !== 'up') {
          direction = 'down';
        }
        break;
      case 'a':
        if (direction !== 'right') {
          direction = 'left';
        }
        break;
      case 'd':
        if (direction !== 'left') {
          direction = 'right';
        }
        break;
      case ' ':
        shootLaser();
        break;
    }
  }

  isTurning = false;

  switch (direction) {
    case 'up':
      head.y--;
      break;
    case 'down':
      head.y++;
      break;
    case 'left':
      head.x--;
      break;
    case 'right':
      head.x++;
      break;
  }

  if (head.x === food.x && head.y === food.y) {
    snake.unshift(head);
    food = generateFood();

    if (Math.random() < 0.3) {
      let obstacle = generateObstacle();
      while (grid[obstacle.y][obstacle.x] !== 0) {
        obstacle = generateObstacle();
      }
      obstacles.push(obstacle);
    }
  } else {
    snake.unshift(head);
    snake.pop();
  }
}

function generateObstacle() {
  const x = Math.floor(Math.random() * gridSize);
  const y = Math.floor(Math.random() * gridSize);
  return { x, y };
}

function shootLaser() {
  const head = snake[0];
  let laser;

  switch (direction) {
    case 'up':
      laser = { x: head.x, y: head.y - 1, speed: 4, direction: 'up' };
      break;
    case 'down':
      laser = { x: head.x, y: head.y + 1, speed: 4, direction: 'down' };
      break;
    case 'left':
      laser = { x: head.x - 1, y: head.y, speed: 4, direction: 'left' };
      break;
    case 'right':
      laser = { x: head.x + 1, y: head.y, speed: 4, direction: 'right' };
      break;
  }

  lasers.push(laser);
}

function moveLasers() {
  lasers.forEach(laser => {
    // Учитываем скорость лазера
    for (let i = 0; i < laser.speed; i++) {
      switch (laser.direction) {
        case 'up':
          laser.y--;
          break;
        case 'down':
          laser.y++;
          break;
        case 'left':
          laser.x--;
          break;
        case 'right':
          laser.x++;
          break;
      }

      // Проверяем столкновение снаряда с препятствием
      const hitObstacleIndex = obstacles.findIndex(obstacle => obstacle.x === laser.x && obstacle.y === laser.y);
      if (hitObstacleIndex !== -1) {
        obstacles.splice(hitObstacleIndex, 1); // Удаляем препятствие при попадании лазера
      }
    }
  });

  // Удаляем снаряды, вышедшие за границы
  lasers = lasers.filter(laser => laser.x >= 0 && laser.x < gridSize && laser.y >= 0 && laser.y < gridSize);
}

function checkCollision() {
  const head = snake[0];
  if (
    head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize ||
    grid[head.y][head.x] === 1 || grid[head.y][head.x] === 4
  ) {
    return true;
  }
  return false;
}

// Обработчики событий для клавиш на клавиатуре
document.addEventListener('keydown', handleKeyDown);

// Обработчики событий для касаний на мобильном устройстве
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchend', handleTouchEnd);

function handleKeyDown(event) {
  if (!isTurning) {
    isTurning = true;
    switch (event.key) {
      case 'w':
        if (direction !== 'down') {
          direction = 'up';
        }
        break;
      case 's':
        if (direction !== 'up') {
          direction = 'down';
        }
        break;
      case 'a':
        if (direction !== 'right') {
          direction = 'left';
        }
        break;
      case 'd':
        if (direction !== 'left') {
          direction = 'right';
        }
        break;
      case ' ':
        shootLaser();
        break;
    }
  }
}

let touchStartY = 0;
let touchStartX = 0;
let lastTap = 0;

function handleTouchStart(event) {
  touchStartY = event.touches[0].clientY;
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event) {
  const touchEndY = event.changedTouches[0].clientY;
  const touchEndX = event.changedTouches[0].clientX;

  const deltaY = touchEndY - touchStartY;
  const deltaX = touchEndX - touchStartX;

  const currentTime = new Date().getTime();
  const tapInterval = currentTime - lastTap;

  if (tapInterval < 300) {
    // Если прошло менее 300 миллисекунд, считаем это двойным тапом
    isAccelerated = !isAccelerated;
  } else {
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // По вертикали
      if (deltaY > 0) {
        // Вниз
        direction = 'down';
      } else {
        // Вверх
        direction = 'up';
      }
    } else {
      // По горизонтали
      if (deltaX > 0) {
        // Вправо
        direction = 'right';
      } else {
        // Влево
        direction = 'left';
      }
    }
  }

  lastTap = currentTime;
}

function gameLoop() {
  moveSnake();
  moveLasers();
  updateGrid();
  renderGrid();

  if (checkCollision()) {
    console.log('Игра окончена!');
    return;
  }

  setTimeout(gameLoop, isAccelerated ? acceleratedSnakeSpeed : snakeSpeed);
}

function startGame() {
  animationFrameId = requestAnimationFrame(gameLoop);

  foodInterval = setInterval(() => {
    food = generateFood();
    renderGrid();
  }, 9000);
}

function stopGame() {
  cancelAnimationFrame(animationFrameId);
  clearInterval(foodInterval);
}

// ...

document.addEventListener('DOMContentLoaded', () => {
  startGame();
});

function renderGrid() {
  const gameContainer = document.getElementById('game-container');
  gameContainer.innerHTML = '';

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.style.width = `${cellSize}px`;
      cellElement.style.height = `${cellSize}px`;

      switch (cell) {
        case 1:
          cellElement.classList.add('snake'); // Добавляем класс для тела змейки
          break;
        case 2:
          cellElement.classList.add('head'); // Добавляем класс для головы змейки
          break;
        case 3:
          cellElement.classList.add('food'); // Добавляем класс для еды
          break;
        case 4:
          cellElement.classList.add('obstacle'); // Добавляем класс для препятствия
          break;
        case 5:
          cellElement.classList.add('laser'); // Добавляем класс для лазера
          break;
      }

      gameContainer.appendChild(cellElement);
    });
  });

  // Отображаем змейку
  snake.forEach(segment => {
    const cellElement = document.createElement('div');
    cellElement.classList.add('cell', 'snake');
    cellElement.style.width = `${cellSize}px`;
    cellElement.style.height = `${cellSize}px`;

    // Преобразование координаты x и y для увеличенного размера
    const x = segment.x * cellSize;
    const y = segment.y * cellSize;

    cellElement.style.left = `${x}px`;
    cellElement.style.top = `${y}px`;
    gameContainer.appendChild(cellElement);
  });
}


document.addEventListener('DOMContentLoaded', () => {
  startGame();
});
