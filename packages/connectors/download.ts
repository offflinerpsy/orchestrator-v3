/**
 * Утилита для скачивания файлов
 */

export async function downloadAndSave(url: string, outputPath: string): Promise<void> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { dirname } = await import('path');
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  
  // Создать директорию если нет
  await mkdir(dirname(outputPath), { recursive: true });
  
  // Сохранить
  await writeFile(outputPath, Buffer.from(buffer));
}
