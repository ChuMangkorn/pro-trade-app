'use client';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import Match3Scene from './Match3Scene';
import { GRID_SIZE, TILE_SIZE } from './constants';

export default function Match3Game() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: GRID_SIZE * TILE_SIZE,
      height: GRID_SIZE * TILE_SIZE,
      parent: containerRef.current,
      backgroundColor: '#000000',
      scene: Match3Scene,
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} />;
}
