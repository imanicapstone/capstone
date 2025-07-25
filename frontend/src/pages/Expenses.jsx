import ExpenseChart from "../components/ExpenseChart";
import Navbar from "../components/Navbar";

const Expenses = () => {
  return (
    <div>
      <Navbar />
      <h1 className="mt-8"> Expenses </h1>
      <ExpenseChart />
    </div>
  );
};

export default Expenses;
