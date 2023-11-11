const grid = Array.from({ length: 25 }, () => Array(25).fill(0));

let snake = [{ x: 12, y: 12 }];
let food = generateFood();
let obstacles = [];
let lasers = [];
let animationFrameId;

let commands = [];
let direction = 'right';
let isTurning = false;
let isAccelerated = false; // Флаг для отслеживания ускорения
let foodInterval;

const snakeSpeed = 200;
const acceleratedSnakeSpeed = snakeSpeed / 3; // Скорость змейки при ускорении
const laserSpeed = 100;

function generateFood() {
  const x = Math.floor(Math.random() * 25);
  const y = Math.floor(Math.random() * 25);
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
        direction = 'up';
        break;
      case 's':
        direction = 'down';
        break;
      case 'a':
        direction = 'left';
        break;
      case 'd':
        direction = 'right';
        break;
      case ' ': // Пробел
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
  const x = Math.floor(Math.random() * 25);
  const y = Math.floor(Math.random() * 25);
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
  lasers = lasers.filter(laser => laser.x >= 0 && laser.x < 25 && laser.y >= 0 && laser.y < 25);
}

function checkCollision() {
  const head = snake[0];
  if (
    head.x < 0 || head.x >= 25 || head.y < 0 || head.y >= 25 ||
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
  switch (event.key) {
    case 'w':
      direction = 'up';
      break;
    case 's':
      direction = 'down';
      break;
    case 'a':
      direction = 'left';
      break;
    case 'd':
      direction = 'right';
      break;
    case 'Shift':
      isAccelerated = !isAccelerated; // Переключение ускорения при нажатии на Shift
      break;
    case ' ':
      shootLaser();
      break;
  }
}

let touchStartY = 0;
let touchStartX = 0;

function handleTouchStart(event) {
  touchStartY = event.touches[0].clientY;
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event) {
  const touchEndY = event.changedTouches[0].clientY;
  const touchEndX = event.changedTouches[0].clientX;

  const deltaY = touchEndY - touchStartY;
  const deltaX = touchEndX - touchStartX;

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

function renderGrid() {
  const gameContainer = document.getElementById('game-container');
  gameContainer.innerHTML = '';

  grid.forEach(row => {
    row.forEach(cell => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      switch (cell) {
        case 1:
          cellElement.style.backgroundColor = 'green'; // Тело змейки
          break;
        case 2:
          cellElement.style.backgroundColor = 'blue'; // Голова змейки
          break;
        case 3:
          cellElement.style.backgroundColor = 'red'; // Еда
          break;
        case 4:
          cellElement.style.backgroundColor = 'black'; // Препятствие
          break;
        case 5:
          cellElement.style.backgroundColor = 'yellow'; // Лазер
          break;
      }
      gameContainer.appendChild(cellElement);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  startGame();
});
