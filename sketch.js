let progress = 0;
let mountainPoints = [];
let eaglePoints = [];
let eaglePos;
let mountainFinished = false;
let finishTime = 0;
let eagleFlying = false;
let eagleCount = 0;

// 背景のデジタル星用
let stars = []; 

let recorder;
let chunks = [];
let isRecording = false;

function setup() {
  createCanvas(windowWidth, windowHeight); 
  frameRate(50)
  // 星の初期位置を50個だけ生成（これなら超軽量です）
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 2.5),
      speed: random(0.2, 0.6)
    });
  }
  
  initSketch();
}

function initSketch() {
  background(10, 15, 28); 
  progress = 0;
  mountainFinished = false;
  eagleFlying = false;
  eagleCount = 0;
  mountainPoints = [];

  let baseY = height * 0.65; 
  
  mountainPoints.push(createVector(0, baseY));
  mountainPoints.push(createVector(width * 0.1, baseY - height * 0.05));
  mountainPoints.push(createVector(width * 0.25, baseY - height * 0.15));
  let peaksData = [{x: 0.4, h: 0.35}, {x: 0.45, h: 0.38}, {x: 0.5, h: 0.36}, {x: 0.55, h: 0.4}, {x: 0.65, h: 0.32}];
  for (let p of peaksData) mountainPoints.push(createVector(width * p.x, baseY - height * p.h));
  mountainPoints.push(createVector(width * 0.8, baseY - height * 0.1));
  mountainPoints.push(createVector(width, baseY));

  eaglePoints = [
    createVector(0, -12), createVector(18, -6), createVector(45, 6),
    createVector(12, 6), createVector(6, 18), createVector(-6, 18),
    createVector(-12, 6), createVector(-45, 6), createVector(-18, -6)
  ];
  resetEagle();
}

function mousePressed() {
  if (!isRecording) startRecording();
}

function startRecording() {
  isRecording = true;
  chunks = [];
  initSketch(); 
  const stream = canvas.captureStream(30); 
  recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = saveVideoFile; 
  recorder.start();
}

function saveVideoFile() {
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'chokai_starfield_cyan.webm';
  downloadLink.click();
  isRecording = false;
}

function draw() {
  // 残像を残すため、少し透明度のある紺色で塗る
  background(10, 15, 28, 40); 
  let cyberCyan = color(0, 238, 255);

  // 1. 背景の星を動かす（ここを追加！）
  drawStars(cyberCyan);

  // 2. 太陽とグリッド
  drawCyberSun(width * 0.8, height * 0.25, height * 0.15, cyberCyan);
  drawWavyGrid(height * 0.65, cyberCyan, eagleFlying ? eaglePos.x : -1000);

  // 3. 山の描画
  push();
  stroke(cyberCyan);
  strokeWeight(0.6);
  drawingContext.shadowBlur = 5;
  drawingContext.shadowColor = cyberCyan;
  noFill();
  
  if (!mountainFinished) progress += (width * 0.015);

  for (let i = 0; i < mountainPoints.length - 1; i++) {
    let p1 = mountainPoints[i];
    let p2 = mountainPoints[i+1];
    if (mountainFinished || p1.x < progress) drawSketchLine(p1.x, p1.y, p2.x, p2.y);
  }
  pop();

  if (!mountainFinished && progress > width * 1.5) {
    mountainFinished = true;
    finishTime = millis();
  }

  if (mountainFinished) {
    showTitle(cyberCyan);
    if (!eagleFlying && millis() - finishTime > 500) eagleFlying = true;
  }

  if (eagleFlying) updateAndDrawEagle(cyberCyan);
  
  if (isRecording) {
    fill(255, 0, 0);
    noStroke();
    circle(30, 30, 20);
  }
}

// 星を描画して左に流す軽量関数
function drawStars(col) {
  push();
  // 山のラインを邪魔しないよう、ほんのり薄い水色で
  fill(red(col), green(col), blue(col), 150);
  noStroke();
  for (let s of stars) {
    s.x -= s.speed; // 左へ流す
    // 左端に消えたら右端からリスタート
    if (s.x < 0) {
      s.x = width;
      s.y = random(height);
    }
    // チカチカさせるためにノイズで少しサイズを揺らす
    let n = noise(s.x * 0.01, frameCount * 0.05) * 0.5 + 0.8;
    circle(s.x, s.y, s.size * n);
  }
  pop();
}

function resetEagle() {
  eaglePos = createVector(width + 100, random(height * 0.1, height * 0.35));
}

function updateAndDrawEagle(col) {
  eaglePos.x -= (width * 0.008);
  eaglePos.y += sin(frameCount * 0.08) * 1.5;

  if (eaglePos.x < -100) {
    eagleCount++;
    if (eagleCount >= 3) {
      if (isRecording) recorder.stop();
      initSketch();
    } else {
      resetEagle();
    }
  }

  push();
  translate(eaglePos.x, eaglePos.y);
  stroke(col);
  strokeWeight(0.9);
  noFill();
  drawingContext.shadowBlur = 8;
  drawingContext.shadowColor = col;
  beginShape();
  for (let i = 0; i < eaglePoints.length; i++) {
    let p1 = eaglePoints[i];
    let p2 = eaglePoints[(i + 1) % eaglePoints.length]; 
    drawSketchLine(p1.x, p1.y, p2.x, p2.y);
  }
  endShape(CLOSE);
  pop();
}

function drawWavyGrid(startY, col, targetX) {
  push();
  stroke(red(col), green(col), blue(col), 40);
  strokeWeight(0.5);
  noFill();
  for (let y = startY; y < height; y += 25) {
    beginShape();
    for (let x = 0; x <= width; x += 30) {
      let d = abs(x - targetX);
      let wave = (d < 250) ? map(d, 0, 250, 40, 0) * sin(frameCount * 0.2) : 0;
      vertex(x, y + wave);
    }
    endShape();
  }
  for (let x = -width; x < width * 2; x += 120) line(width / 2, startY, x, height);
  pop();
}

function drawCyberSun(x, y, r, col) {
  push();
  stroke(col);
  noFill();
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = col;
  for (let i = -r; i < r; i += 8) {
    let w = sqrt(r * r - i * i) * 2;
    line(x - w / 2, y + i, x + w / 2, y + i);
  }
  pop();
}

function drawSketchLine(x1, y1, x2, y2) {
  beginShape();
  for (let t = 0; t <= 1; t += 0.25) {
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
    let nx = noise(x * 0.1, frameCount * 0.05) * 2 - 1;
    let ny = noise(y * 0.1, frameCount * 0.05) * 2 - 1;
    vertex(x + nx, y + ny);
  }
  endShape();
}

function showTitle(col) {
  push();
  fill(col);
  noStroke();
  textAlign(RIGHT);
  textFont('Courier New');
  textSize(14);
  text("DATA_STREAM: MT.CHOKAI // BLUESKY_STARS", width - 30, height - 50);
  text("ITERATION: " + (eagleCount + 1) + "/3", width - 30, height - 30);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initSketch();
}
