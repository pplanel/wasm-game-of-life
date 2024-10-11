//! # Game of Life
//!
//! This module implements Conway's Game of Life using Rust and WebAssembly.
//! It provides a `Universe` struct that represents the game grid and methods
//! to manipulate and evolve the cellular automaton.
extern crate fixedbitset;
extern crate web_sys;
use fixedbitset::FixedBitSet;

mod utils;

use wasm_bindgen::prelude::*;

/// Represents the universe of the Game of Life.
///
/// The universe is a 2D grid of cells, where each cell is either alive or dead.
#[wasm_bindgen]
#[derive(Default, Debug)]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
    next_cells: FixedBitSet, // Used for double buffering
}

impl Universe {
    /// Returns a slice of the current state of all cells.
    ///
    /// This method is useful for debugging or for advanced rendering techniques.
    pub fn get_cells(&self) -> &[usize] {
        self.cells.as_slice()
    }

    /// Sets the state of multiple cells at once.
    ///
    /// # Arguments
    ///
    /// * `cells` - A slice of (row, column) pairs representing live cells to set.
    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        cells.iter().for_each(|(row, column)| {
            let idx = self.get_index(*row, *column);
            self.cells.set(idx, true);
        });
    }
}

#[wasm_bindgen]
impl Universe {
    /// Creates a new universe with the specified dimensions.
    ///
    /// # Arguments
    ///
    /// * `width` - The width of the universe.
    /// * `height` - The height of the universe.
    ///
    /// # Returns
    ///
    /// A new `Universe` instance with a random initial state.
    pub fn new(width: u32, height: u32) -> Self {
        utils::set_panic_hook();

        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        for i in 0..size {
            cells.set(i, i % 2 == 0 || i % 7 == 0);
        }

        let next_cells = cells.clone(); // Initialize next_cells

        Self {
            width,
            height,
            cells,
            next_cells,
        }
    }

    /// Returns the width of the universe.
    pub fn width(&self) -> u32 {
        self.width
    }

    /// Returns the height of the universe.
    pub fn height(&self) -> u32 {
        self.height
    }

    /// Returns the total number of cells in the universe.
    pub fn area(&self) -> u32 {
        self.width * self.height
    }

    /// Sets the width of the universe.
    ///
    /// This method resets all cells to the dead state.
    ///
    /// # Arguments
    ///
    /// * `width` - The new width of the universe.
    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.cells.set_range(.., false);
    }

    /// Sets the height of the universe.
    ///
    /// This method resets all cells to the dead state.
    ///
    /// # Arguments
    ///
    /// * `height` - The new height of the universe.
    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.cells.set_range(.., false);
    }

    /// Returns a pointer to the cells buffer.
    ///
    /// This method is primarily used for JavaScript interop.
    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr() as *const u32
    }

    /// Returns the state of a cell at the given coordinates.
    ///
    /// # Arguments
    ///
    /// * `row` - The row of the cell.
    /// * `column` - The column of the cell.
    ///
    /// # Returns
    ///
    /// `true` if the cell is alive, `false` if it's dead.
    pub fn get_cell_state(&self, row: u32, column: u32) -> bool {
        let idx = self.get_index(row, column);
        self.cells[idx]
    }

    /// Toggles the state of a cell at the given coordinates.
    ///
    /// # Arguments
    ///
    /// * `row` - The row of the cell to toggle.
    /// * `column` - The column of the cell to toggle.
    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells.toggle(idx);
    }

    /// Converts 2D coordinates to a 1D index in the cells array.
    ///
    /// # Arguments
    ///
    /// * `row` - The row of the cell.
    /// * `column` - The column of the cell.
    ///
    /// # Returns
    ///
    /// The 1D index corresponding to the given 2D coordinates.
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    /// Converts a 1D index to 2D coordinates.
    ///
    /// # Arguments
    ///
    /// * `idx` - The 1D index to convert.
    ///
    /// # Returns
    ///
    /// A tuple `(row, column)` representing the 2D coordinates.
    fn get_row_col(&self, idx: u32) -> (u32, u32) {
        (idx / self.width(), idx % self.width())
    }

    /// Advances the universe by one generation according to the Game of Life rules.
    pub fn tick(&mut self) {
        utils::Timer::new("Universe::tick");
        // Clear next_cells for the new generation
        self.next_cells.clear();

        for i in 0..self.area() {
            let (row, col) = self.get_row_col(i);
            let cell = self.cells[i as usize];
            let live_neighbors = self.live_neighbor_count(row, col);

            self.next_cells.set(
                i as usize,
                match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbors dies (underpopulation).
                    (true, x) if x < 2 => false,
                    // Rule 2: Any live cell with two or three live neighbors lives on to the next generation.
                    (true, 2) | (true, 3) => true,
                    // Rule 3: Any live cell with more than three live neighbors dies (overpopulation).
                    (true, x) if x > 3 => false,
                    // Rule 4: Any dead cell with exactly three live neighbors becomes a live cell (reproduction).
                    (false, 3) => true,
                    // All other cases: the cell remains in its current state.
                    (otherwise, _) => otherwise,
                },
            );
        }
        // Swap cells and next_cells
        std::mem::swap(&mut self.cells, &mut self.next_cells);
    }

    /// Counts the number of live neighbors for a given cell.
    ///
    /// This method implements wraparound at the edges of the universe.
    ///
    /// # Arguments
    ///
    /// * `row` - The row of the cell.
    /// * `column` - The column of the cell.
    ///
    /// # Returns
    ///
    /// The number of live neighbors (0-8).
    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;

        let north = if row == 0 { self.height - 1 } else { row - 1 };
        let south = if row == self.height - 1 { 0 } else { row + 1 };
        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };
        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        let nw = self.get_index(north, west);
        count += self.cells[nw] as u8;

        let n = self.get_index(north, column);
        count += self.cells[n] as u8;

        let ne = self.get_index(north, east);
        count += self.cells[ne] as u8;

        let w = self.get_index(row, west);
        count += self.cells[w] as u8;

        let e = self.get_index(row, east);
        count += self.cells[e] as u8;

        let sw = self.get_index(south, west);
        count += self.cells[sw] as u8;

        let s = self.get_index(south, column);
        count += self.cells[s] as u8;

        let se = self.get_index(south, east);
        count += self.cells[se] as u8;

        count
    }
}
