import { Request, Response } from "express";
import { Table } from "../models/Table";

export const getTables = async (req: Request, res: Response) => {
  try {
    const tables = await Table.find().populate("floor");
    res.json({ data: tables });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tables" });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json({ data: table });
  } catch (error) {
    res.status(500).json({ message: "Error creating table" });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("floor");
    res.json({ data: table });
  } catch (error) {
    res.status(500).json({ message: "Error updating table" });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: "Table deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting table" });
  }
};
