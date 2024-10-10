use rayon::prelude::*;
use std::cmp::Ordering;

#[derive(Debug)]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
    next_cells: FixedBitSet,
}

impl Universe {
    pub fn new(width: u32, height: u32) -> Self {
        Universe {
            width,
            height,
            cells: FixedBitSet::new(width * height),
            next_cells: FixedBitSet::new(width * height),
        }
    }

    pub fn tick(&mut self) {
        for i in 0..self.width * self.height {
            let row = i / self.width;
            let col = i % self.width;
            let live_neighbors = self.count_live_neighbors(row, col);

            // Apply Game of Life rules using bitwise operations
            if self.cells[i] { 
                if live_neighbors == 2 || live_neighbors == 3 {
                    self.next_cells.set(i, true);
                } else {
                    self.next_cells.set(i, false);
                }
            } else {
                if live_neighbors == 3 {
                    self.next_cells.set(i, true);
                } else {
                    self.next_cells.set(i, false);
                }
            }
        }

        std::mem::swap(&mut self.cells, &mut self.next_cells);
    }

    fn count_live_neighbors(&self, row: u32, col: u32) -> u8 {
        let mut count = 0;
        for r in (row - 1)..(row + 2) {
            for c in (col - 1)..(col + 2) {
                if let Some(idx) = self.get_index(r, c) {
                    if idx != self.get_index(row, col) && self.cells[idx] {
                        count += 1;
                    }
                }
            }
        }

        // Handle boundary conditions if needed
        count
    }

    fn get_index(&self, row: u32, col: u32) -> Option<usize> {
        if row < self.height && col < self.width {
            Some(row * self.width + col as usize)
        } else {
            None
        }
    }

    // ... other methods ...
}



