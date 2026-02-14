export interface LayoutElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  rotation?: number; // Угол наклона в градусах
}

export interface LayoutConfig {
  avatar: LayoutElement;
  username: LayoutElement;
  loveNote: LayoutElement;
  message: LayoutElement;
  fromLabel: LayoutElement; // "from @username" слева внизу
  toLabel: LayoutElement;   // "to @recipient" справа внизу
  recipientAvatar: LayoutElement;
  recipientUsername: LayoutElement;
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  avatar: { id: 'avatar', x: -35, y: 0, width: 140, height: 140 },
  username: { id: 'username', x: -5, y: 150, width: 210, height: 45, fontSize: 19 },
  recipientAvatar: { id: 'recipientAvatar', x: 301, y: 0, width: 140, height: 140 },
  recipientUsername: { id: 'recipientUsername', x: 190, y: 160, width: 210, height: 45, fontSize: 19 },
  loveNote: { id: 'loveNote', x: 100, y: 205, width: 216, height: 22, fontSize: 8 },
  message: { id: 'message', x: 68, y: 220, width: 280, height: 90, fontSize: 28 },
  fromLabel: { id: 'fromLabel', x: 75, y: 330, width: 100, height: 20, fontSize: 11, rotation: 39 },
  toLabel: { id: 'toLabel', x: 260, y: 315, width: 100, height: 20, fontSize: 11, rotation: -39 }
};

export const getValentineLayout = (): LayoutConfig => {
  return DEFAULT_LAYOUT;
};
