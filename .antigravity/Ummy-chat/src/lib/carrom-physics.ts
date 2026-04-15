
/**
 * Carrom Master Physics Engine.
 * Handles 2D elastic collisions, friction, and pocketing logic.
 */

export interface Vector {
  x: number;
  y: number;
}

const BOARD_SIZE = 100; // Normalized 100x100
const FRICTION = 0.985; // Deceleration factor
const MIN_VELOCITY = 0.1;
const BOUNCE_DAMPING = 0.7;
const PIECE_RADIUS = 3.5; // Normalized radius
const STRIKER_RADIUS = 5.5;
const POCKET_RADIUS = 8;

export const POCKETS: Vector[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 0, y: 100 },
  { x: 100, y: 100 }
];

export function updatePhysics(pieces: any[], deltaTime: number = 16) {
  let hasMovement = false;

  const newPieces = pieces.map(piece => {
    if (piece.isPocketed) return piece;

    // Apply Velocity
    let nextX = piece.position.x + piece.velocity.x;
    let nextY = piece.position.y + piece.velocity.y;

    // Apply Friction
    let nextVelX = piece.velocity.x * FRICTION;
    let nextVelY = piece.velocity.y * FRICTION;

    if (Math.abs(nextVelX) < MIN_VELOCITY) nextVelX = 0;
    if (Math.abs(nextVelY) < MIN_VELOCITY) nextVelY = 0;

    // Wall Collisions
    const radius = piece.type === 'striker' ? STRIKER_RADIUS : PIECE_RADIUS;
    
    if (nextX <= radius || nextX >= BOARD_SIZE - radius) {
      nextVelX = -nextVelX * BOUNCE_DAMPING;
      nextX = nextX <= radius ? radius : BOARD_SIZE - radius;
    }
    if (nextY <= radius || nextY >= BOARD_SIZE - radius) {
      nextVelY = -nextVelY * BOUNCE_DAMPING;
      nextY = nextY <= radius ? radius : BOARD_SIZE - radius;
    }

    if (nextVelX !== 0 || nextVelY !== 0) hasMovement = true;

    return {
      ...piece,
      position: { x: nextX, y: nextY },
      velocity: { x: nextVelX, y: nextVelY }
    };
  });

  // Circle-Circle Collisions (Simplified Elastic)
  for (let i = 0; i < newPieces.length; i++) {
    for (let j = i + 1; j < newPieces.length; j++) {
      const p1 = newPieces[i];
      const p2 = newPieces[j];

      if (p1.isPocketed || p2.isPocketed) continue;

      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const r1 = p1.type === 'striker' ? STRIKER_RADIUS : PIECE_RADIUS;
      const r2 = p2.type === 'striker' ? STRIKER_RADIUS : PIECE_RADIUS;

      if (distance < r1 + r2) {
        // Resolve Overlap
        const overlap = r1 + r2 - distance;
        const nx = dx / distance;
        const ny = dy / distance;
        
        p1.position.x -= nx * (overlap / 2);
        p1.position.y -= ny * (overlap / 2);
        p2.position.x += nx * (overlap / 2);
        p2.position.y += ny * (overlap / 2);

        // Simple Momentum Transfer
        const tempX = p1.velocity.x;
        const tempY = p1.velocity.y;
        p1.velocity.x = p2.velocity.x * BOUNCE_DAMPING;
        p1.velocity.y = p2.velocity.y * BOUNCE_DAMPING;
        p2.velocity.x = tempX * BOUNCE_DAMPING;
        p2.velocity.y = tempY * BOUNCE_DAMPING;
        
        hasMovement = true;
      }
    }
  }

  // Pocketing Check
  const finalPieces = newPieces.map(piece => {
    if (piece.isPocketed) return piece;
    
    const isInsidePocket = POCKETS.some(pocket => {
      const dist = Math.sqrt(
        Math.pow(piece.position.x - pocket.x, 2) + 
        Math.pow(piece.position.y - pocket.y, 2)
      );
      return dist < POCKET_RADIUS;
    });

    if (isInsidePocket) {
      return { ...piece, isPocketed: true, velocity: { x: 0, y: 0 } };
    }
    return piece;
  });

  return { pieces: finalPieces, hasMovement };
}
