import React, { useState } from "react";
import API from "../api/api";

export default function AddExpense({ onAdd }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "FOOD",
    date: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("expenses/", form);
      onAdd(res.data); // update UI
      setForm({
        title: "",
        amount: "",
        category: "FOOD",
        date: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error adding expense");
    }
  };

  return (
    <div>
      <h2>Add Expense</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option value="FOOD">Food</option>
          <option value="TRAVEL">Travel</option>
          <option value="SHOPPING">Shopping</option>
          <option value="BILLS">Bills</option>
          <option value="OTHER">Other</option>
        </select>

        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <button type="submit">Add</button>
      </form>
    </div>
  );
}