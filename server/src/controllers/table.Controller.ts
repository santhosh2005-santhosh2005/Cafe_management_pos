import { Request, Response } from "express";
import { Table } from "../models/Table";

export const getTables = async (req: Request, res: Response) => {
  try {
    const tables = await Table.find().populate("floor").populate("assignedWaiter");
    res.json({ data: tables });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tables" });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const table = new Table(req.body);
    await table.save();
    const populated = await table.populate("floor assignedWaiter");
    res.status(201).json({ data: populated });
  } catch (error) {
    res.status(500).json({ message: "Error creating table" });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const { assignedWaiter, ...otherFields } = req.body;
    const updateData: any = { ...otherFields };
    
    if (assignedWaiter === null || assignedWaiter === "none") {
      updateData.assignedWaiter = null;
    } else if (assignedWaiter) {
      updateData.assignedWaiter = assignedWaiter;
    }

    const table = await Table.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("floor")
      .populate("assignedWaiter");
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

export const getTableStats = async (req: Request, res: Response) => {
  try {
    const tables = await Table.find();
    const total = tables.length;
    const available = tables.filter(t => t.status === "free").length;
    res.json({ total, available });
  } catch (error) {
    res.status(500).json({ message: "Error fetching table stats" });
  }
};

export const getAssignedTables = async (req: any, res: Response) => {
  try {
    const waiterId = req.user?.id;
    if (!waiterId) return res.status(401).json({ message: "Unauthorized" });

    const tables = await Table.find({ assignedWaiter: waiterId }).populate("floor");
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned tables", error });
  }
};
