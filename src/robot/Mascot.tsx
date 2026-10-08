/**
 * Picks which character to draw, based on `robot.character` in the config:
 *   'avatar' → the cartoon portrait (Character.tsx)
 *   'robot'  → the original robot (Robot.tsx)
 */
import { portfolio } from '../config/portfolio.config';
import { Character, CharacterAvatar } from './Character';
import { Robot, type RobotProps } from './Robot';
import { RobotAvatar } from './RobotFace';
import type { Emotion } from './types';

export function Mascot(props: RobotProps) {
  return portfolio.robot.character === 'robot' ? <Robot {...props} /> : <Character {...props} />;
}

export function MascotAvatar({ emotion, still }: { emotion: Emotion; still?: boolean }) {
  return portfolio.robot.character === 'robot'
    ? <RobotAvatar emotion={emotion} size={42} still={still} />
    : <CharacterAvatar emotion={emotion} size={40} still={still} />;
}
