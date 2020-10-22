import { AppEvent, Board, exampleBoard, Id } from "../../common/domain"
import { boardReducer } from "../../common/state"
import { withDBClient } from "./db"
import * as L from "lonna"
import { update } from "lodash"

let updateQueue: Board[] = []

let boards: Board[] = []

export async function getBoard(id: Id): Promise<Board> {
    let board = boards.find(b => b.id === id)
    if (!board) {
        const result = await withDBClient(client => client.query("SELECT content FROM board WHERE id=$1", [id]))
        if (result.rows.length == 0) {
            if (id === exampleBoard.id) {
                board = exampleBoard
            } else {
                throw Error(`Board ${id} not found`)
            }
        } else {
            board = result.rows[0].content as Board            
        }
        boards.push(board)
    }
    return board
}

export async function updateBoards(appEvent: AppEvent & { boardId: Id }) {
    await getBoard(appEvent.boardId)
    boards = boards.map(board => board.id === appEvent.boardId 
        ? markForSave(boardReducer(board, appEvent))
        : board)
}

export function addBoard(board: Board) {
    boards.push(board)

}

export function getActiveBoards() {
    return boards
}

function markForSave(board: Board): Board {
    updateQueue = updateQueue.filter(b => b.id !== board.id).concat(board)
    console.log(updateQueue.length)
    return board
}

setInterval(saveBoards, 1000)

async function saveBoards() {
    while (updateQueue.length > 0) {
        const board = updateQueue.shift()!
        await saveBoard(board)
    }
}

async function saveBoard(board: Board) {
    try {        
        await withDBClient(async client => {
            client.query(
                `INSERT INTO board(id, name, content) VALUES ($1, $2, $3)
                 ON CONFLICT (id) DO UPDATE SET name=excluded.name, content=excluded.content WHERE board.id=excluded.id`,
                [board.id, board.name, board]
            )
        })
    } catch (e) {
        console.error("Board save failed for board", board.id, e)
    }
}