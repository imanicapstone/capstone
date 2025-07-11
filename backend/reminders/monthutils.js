const currentDate = new Date();

const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

module.exports = {
  monthStart,
  monthEnd,
};