extern crate fixedbitset;
extern crate web_sys;
use fixedbitset::FixedBitSet;

mod utils;

// macro_rules! log {
//     ( $($t:tt)*) => {
//         web_sys::console::log_1(&format!( $($t)*).into())
//     };
// }

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Default, Debug)]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
    next_cells: FixedBitSet, // Added next_cells for double buffering
}

impl Universe {
    pub fn get_cells(&self) -> &[usize] {
        self.cells.as_slice()
    }

    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        cells.iter().for_each(|(row, column)| {
            let idx = self.get_index(*row, *column);
            self.cells.set(idx, true);
        });
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn new() -> Self {
        utils::set_panic_hook();
        let width = 600;
        let height = 300;

        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);
        let next_cells = FixedBitSet::with_capacity(size); // Initialize next_cells

        for i in 0..size {
            cells.set(i, i % 2 == 0 || i % 7 == 0);
        }

        Self {
            width,
            height,
            cells,
            next_cells, // Initialize next_cells in the struct
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    /// Set the width of the universe.
    ///
    /// Resets all cells to the dead state.
    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.cells.set_range(.., false);
    }

    /// Set the height of the universe.
    ///
    /// Resets all cells to the dead state.
    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.cells.set_range(.., false);
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr() as *const u32
    }

    pub fn get_cell_state(&self, row: u32, column: u32) -> bool {
        let idx = self.get_index(row, column);
        self.cells[idx]
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells.toggle(idx);
    }

    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn tick(&mut self) {
        utils::Timer::new("Universe::tick");
        // Clear next_cells for the new generation
        self.next_cells.set_range(.., false);

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                self.next_cells.set(
                    idx,
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
        }
        // Swap cells and next_cells
        std::mem::swap(&mut self.cells, &mut self.next_cells);
    }


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

#[test]
fn test_universe() {
    let mut universe = Universe::new();
    universe.tick();
}
