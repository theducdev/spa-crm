export function isWithinWorkingHours(): boolean {
  // Lấy thời gian theo múi giờ Việt Nam (UTC+7)
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  const hours = vietnamTime.getHours();
  const minutes = vietnamTime.getMinutes();
  
  // Chuyển đổi thời gian hiện tại sang số phút từ 00:00
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Giờ làm việc: 7:00 - 17:30
  const workStartInMinutes = 7 * 60; // 7:00
  const workEndInMinutes = 17 * 60 + 30; // 17:30
  
  return currentTimeInMinutes >= workStartInMinutes && currentTimeInMinutes <= workEndInMinutes;
} 