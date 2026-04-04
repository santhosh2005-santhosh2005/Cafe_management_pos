import { Request, Response } from "express";
import { Floor } from "../models/Floor";

export const getFloors = async (req: Request, res: Response) => {
  try {
    const floors = await Floor.find();
    res.json({ data: floors });
  } catch (error) {
    res.status(500).json({ message: "Error fetching floors" });
  }
};

export const createFloor = async (req: Request, res: Response) => {
  try {
    const floor = new Floor(req.body);
    await floor.save();
    res.status(201).json({ data: floor });
  } catch (error) {
    res.status(500).json({ message: "Error creating floor" });
  }
};

export const updateFloor = async (req: Request, res: Response) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: floor });
  } catch (error) {
    res.status(500).json({ message: "Error updating floor" });
  }
};

export const deleteFloor = async (req: Request, res: Response) => {
  try {
    await Floor.findByIdAndDelete(req.params.id);
    res.json({ message: "Floor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting floor" });
  }
};
