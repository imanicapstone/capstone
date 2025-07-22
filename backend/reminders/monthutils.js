function getWeekOfMonth(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + start.getDay()) / 7);
}

const currentDate = new Date();

const monthStart = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth(),
  1
);
const monthEnd = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth() + 1,
  0
);

module.exports = {
  monthStart,
  monthEnd,
  getWeekOfMonth,
};
