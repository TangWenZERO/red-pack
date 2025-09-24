"use client";

import { useEffect, useRef } from 'react';
import styles from './StarField.module.css';

type StarLayer = 'near' | 'mid' | 'far';

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  layer: StarLayer;
  driftX: number;
  driftY: number;
}

interface Planet {
  x: number;
  y: number;
  size: number;
  color: string;
  orbitRadius: number;
  orbitX: number;
  orbitY: number;
  angle: number;
  speed: number;
  ring?: boolean;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  colors: [string, string, string];
  rotation: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

const STAR_COLOURS = [
  { color: '#fdfdfd', weight: 0.38 },
  { color: '#f7f1d5', weight: 0.24 },
  { color: '#cfe7ff', weight: 0.18 },
  { color: '#ffe7d9', weight: 0.12 },
  { color: '#bfc9ff', weight: 0.08 },
];

const LAYER_SETTINGS: Record<StarLayer, { speed: number; parallax: number }> = {
  near: { speed: 0.02, parallax: 0.05 },
  mid: { speed: 0.01, parallax: 0.03 },
  far: { speed: 0.004, parallax: 0.015 },
};

const pickColour = () => {
  const total = STAR_COLOURS.reduce((sum, entry) => sum + entry.weight, 0);
  let rnd = Math.random() * total;
  for (const entry of STAR_COLOURS) {
    if (rnd < entry.weight) {
      return entry.color;
    }
    rnd -= entry.weight;
  }
  return STAR_COLOURS[0]!.color;
};

const createStar = (width: number, height: number, layer: StarLayer): Star => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size:
    layer === 'near'
      ? Math.random() * 1.4 + 0.6
      : layer === 'mid'
      ? Math.random() * 1.0 + 0.3
      : Math.random() * 0.6 + 0.15,
  baseOpacity:
    layer === 'near' ? Math.random() * 0.7 + 0.45 : Math.random() * 0.45 + 0.2,
  twinkleSpeed: Math.random() * 0.015 + 0.004,
  twinklePhase: Math.random() * Math.PI * 2,
  color: pickColour(),
  layer,
  driftX: (Math.random() - 0.5) * 0.01,
  driftY: (Math.random() - 0.5) * 0.01,
});

const createPlanet = (
  width: number,
  height: number,
  index: number
): Planet => {
  const distance = 160 + index * 160 + Math.random() * 120;
  const angle = Math.random() * Math.PI * 2;
  const palette = ['#d9a066', '#f4c38f', '#8fb4ff', '#9c8b6f', '#d3d7ff'];
  const color = palette[Math.floor(Math.random() * palette.length)] ?? '#d9a066';

  return {
    x: width / 2 + Math.cos(angle) * distance,
    y: height / 2 + Math.sin(angle) * distance,
    size: Math.random() * 24 + 14,
    color,
    orbitRadius: distance,
    orbitX: width / 2,
    orbitY: height / 2,
    angle,
    speed: Math.random() * 0.0015 + 0.0004,
    ring: Math.random() < 0.35,
  };
};

const createNebula = (width: number, height: number): Nebula => {
  const palettes: [string, string, string][] = [
    ['rgba(46, 54, 119, 0.45)', 'rgba(24, 32, 62, 0.32)', 'rgba(0, 0, 0, 0)'],
    ['rgba(32, 44, 92, 0.42)', 'rgba(14, 20, 46, 0.3)', 'rgba(0, 0, 0, 0)'],
    ['rgba(24, 32, 62, 0.48)', 'rgba(10, 14, 28, 0.34)', 'rgba(0, 0, 0, 0)'],
  ];
  const colors = palettes[Math.floor(Math.random() * palettes.length)] ?? palettes[0]!;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 300 + 200,
    colors,
    rotation: Math.random() * Math.PI * 2,
  };
};

const createShootingStar = (width: number, height: number): ShootingStar => {
  const startX = Math.random() * width * 0.5;
  const startY = Math.random() * height * 0.3;
  const speed = Math.random() * 12 + 8;
  const angle = Math.random() * (Math.PI / 4) + Math.PI * 1.25;
  return {
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: Math.random() * 60 + 60,
    length: Math.random() * 120 + 80,
  };
};

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars: Star[] = [];
    const planets: Planet[] = [];
    const nebulas: Nebula[] = [];
    const shootingStars: ShootingStar[] = [];

    function createScene() {
      stars.length = 0;
      planets.length = 0;
      nebulas.length = 0;
      shootingStars.length = 0;

      const area = canvas.width * canvas.height;
      const baseStarCount = Math.min(1200, Math.floor(area / 90));

      const layerDistribution: Record<StarLayer, number> = {
        near: Math.floor(baseStarCount * 0.25),
        mid: Math.floor(baseStarCount * 0.35),
        far: Math.floor(baseStarCount * 0.4),
      };

      (Object.keys(layerDistribution) as StarLayer[]).forEach((layer) => {
        const count = layerDistribution[layer];
        for (let i = 0; i < count; i++) {
          stars.push(createStar(canvas.width, canvas.height, layer));
        }
      });

      const planetCount = Math.min(6, Math.max(3, Math.round(canvas.width / 500)));
      for (let i = 0; i < planetCount; i++) {
        planets.push(createPlanet(canvas.width, canvas.height, i));
      }

      const nebulaCount = Math.min(4, Math.max(2, Math.round(area / 800000)));
      for (let i = 0; i < nebulaCount; i++) {
        nebulas.push(createNebula(canvas.width, canvas.height));
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createScene();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;

    const render = () => {
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#010103';
      ctx.fillRect(0, 0, width, height);

      const milkyWayGradient = ctx.createLinearGradient(0, height * 0.2, width, height * 0.8);
      milkyWayGradient.addColorStop(0, 'rgba(12, 18, 38, 0)');
      milkyWayGradient.addColorStop(0.5, 'rgba(35, 49, 88, 0.25)');
      milkyWayGradient.addColorStop(1, 'rgba(12, 18, 38, 0)');
      ctx.fillStyle = milkyWayGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      nebulas.forEach((nebula) => {
        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation);

        const gradient = ctx.createRadialGradient(0, 0, nebula.radius * 0.2, 0, 0, nebula.radius);
        gradient.addColorStop(0, nebula.colors[0]);
        gradient.addColorStop(0.6, nebula.colors[1]);
        gradient.addColorStop(1, nebula.colors[2]);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, nebula.radius, nebula.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.globalCompositeOperation = 'source-over';

      const now = performance.now();

      stars.forEach((star) => {
        const layerSettings = LAYER_SETTINGS[star.layer];
        star.twinklePhase += star.twinkleSpeed;

        star.x += star.driftX * layerSettings.speed;
        star.y += star.driftY * layerSettings.speed;

        if (star.x < 0) star.x += width;
        if (star.x > width) star.x -= width;
        if (star.y < 0) star.y += height;
        if (star.y > height) star.y -= height;

        const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase + now * 0.0002);
        const opacity = star.baseOpacity * twinkle;

        if (star.layer === 'near') {
          const glowRadius = star.size * 3.2;
          const glowGradient = ctx.createRadialGradient(
            star.x,
            star.y,
            star.size,
            star.x,
            star.y,
            glowRadius
          );
          glowGradient.addColorStop(0, `${star.color}33`);
          glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.floor(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
        ctx.fill();
      });

      planets.forEach((planet) => {
        planet.angle += planet.speed;
        planet.x = planet.orbitX + Math.cos(planet.angle) * planet.orbitRadius;
        planet.y = planet.orbitY + Math.sin(planet.angle) * planet.orbitRadius;

        if (planet.ring) {
          ctx.save();
          ctx.translate(planet.x, planet.y);
          ctx.rotate(planet.angle * 0.6);
          ctx.beginPath();
          ctx.ellipse(0, 0, planet.size * 1.8, planet.size * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(230, 230, 230, 0.55)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        const glowGradient = ctx.createRadialGradient(
          planet.x,
          planet.y,
          planet.size,
          planet.x,
          planet.y,
          planet.size * 1.8
        );
        glowGradient.addColorStop(0, `${planet.color}aa`);
        glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.fill();

        const highlightGradient = ctx.createRadialGradient(
          planet.x - planet.size * 0.45,
          planet.y - planet.size * 0.45,
          0,
          planet.x - planet.size * 0.45,
          planet.y - planet.size * 0.45,
          planet.size * 0.5
        );
        highlightGradient.addColorStop(0, 'rgba(255,255,255,0.75)');
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(
          planet.x - planet.size * 0.45,
          planet.y - planet.size * 0.45,
          planet.size * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = highlightGradient;
        ctx.fill();
      });

      if (shootingStars.length < 3 && Math.random() < 0.005) {
        shootingStars.push(createShootingStar(width, height));
      }

      shootingStars.forEach((shootingStar, index) => {
        shootingStar.life += 1;
        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;

        const progress = shootingStar.life / shootingStar.maxLife;
        const opacity = Math.sin(progress * Math.PI);

        ctx.beginPath();
        const trailGradient = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - shootingStar.vx * 4,
          shootingStar.y - shootingStar.vy * 4
        );
        trailGradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
        trailGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = 2;
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(
          shootingStar.x - Math.cos(Math.atan2(shootingStar.vy, shootingStar.vx)) * shootingStar.length,
          shootingStar.y - Math.sin(Math.atan2(shootingStar.vy, shootingStar.vx)) * shootingStar.length
        );
        ctx.stroke();

        if (
          shootingStar.life > shootingStar.maxLife ||
          shootingStar.x < -shootingStar.length ||
          shootingStar.y > height + shootingStar.length
        ) {
          shootingStars.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.starCanvas} />;
};

export default StarField;
