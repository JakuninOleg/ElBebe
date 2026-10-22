export const groupVideos: Record<string, {
  sourceFile: string; src: string; poster: string; title: string; description: string;
  width: number; height: number; duration: string;
}> = {
  younger: {
    sourceFile: 'small.mp4', src: '/videos/el-bebe/younger-v1.mp4',
    poster: '/images/el-bebe/video-younger-cover-v1.webp',
    title: 'Игра и первые открытия', description: 'Наблюдаем, пробуем и играем вместе с воспитателем.',
    width: 576, height: 1024, duration: '2:23',
  },
  middle: {
    sourceFile: 'middle.mp4', src: '/videos/el-bebe/middle-v1.mp4',
    poster: '/images/el-bebe/video-middle-cover-v1.webp',
    title: 'Занятие в средней группе', description: 'Рассматриваем картинки, обсуждаем задания и учимся вместе.',
    width: 576, height: 720, duration: '3:30',
  },
  older: {
    sourceFile: 'robo.mp4', src: '/videos/el-bebe/older-v1.mp4',
    poster: '/images/el-bebe/video-older-cover-v1.webp',
    title: 'Робототехника в старшей группе', description: 'Собираем модели и проверяем, как они двигаются.',
    width: 576, height: 720, duration: '1:28',
  },
};
