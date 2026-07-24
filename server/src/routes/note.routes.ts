import { Router } from 'express';
import * as noteController from '../controllers/note.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createNoteSchema), noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNote);
router.patch('/:id', validate(updateNoteSchema), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;
