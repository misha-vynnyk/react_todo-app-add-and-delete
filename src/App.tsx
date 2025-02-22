/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import * as todoService from './api/todos';
import TodosList from './components/TodosList';

export const App: React.FC = () => {
  //#region state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempoTodo, setTempoTodo] = useState<Todo | null>(null);
  const [leftItems, setLeftItems] = useState(0);

  const [todoTitle, setTodoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTodo, setIsLoadingTodo] = useState<number | null>(null);

  const [filterTerm, setFilterTerm] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  //#endregion state

  // eslint-disable-next-line no-console
  console.log('TempoTodo:', tempoTodo);
  // eslint-disable-next-line no-console
  console.log('TodoTitle:', todoTitle);

  //#region function
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [todos]);

  useEffect(() => {
    const activeCount = todos.reduce((acm, todo) => {
      return todo.completed ? acm : acm + 1;
    }, 0);

    setLeftItems(activeCount);
  }, [todos]);

  function loadTodos() {
    setIsLoading(true);
    todoService
      .getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => setIsLoading(false));
  }

  const filteredTodos = useMemo(() => {
    switch (filterTerm) {
      case 'completed':
        return todos.filter(todo => todo.completed);
      case 'active':
        return todos.filter(todo => !todo.completed);
      default:
        return todos;
    }
  }, [todos, filterTerm]);

  function addTodo({ title, userId, completed }: Todo) {
    setIsLoadingTodo(userId);
    setIsLoading(true);

    todoService
      .createTodo({ title, userId, completed })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch(() => {
        setErrorMessage('Unable to add todos');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingTodo(null);
        setTempoTodo(null);
        setTimeout(() => setErrorMessage(''), 3000);
      });
  }

  function deleteTodo(todoId: number) {
    setIsLoadingTodo(todoId);
    todoService
      .deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodo => currentTodo.filter(todo => todo.id !== todoId));
      })
      .catch(() => {
        setErrorMessage('Unable to delete todos');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => setIsLoadingTodo(null));
  }

  function updateTodo(todoId: number, newStatus: boolean) {
    setTodos(currentTodos =>
      currentTodos.map(todo =>
        todo.id === todoId ? { ...todo, completed: newStatus } : todo,
      ),
    );

    setIsLoadingTodo(todoId);

    todoService
      .updateTodo(todoId, newStatus)
      .catch(() => {
        setErrorMessage('Unable to update todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => setIsLoadingTodo(null));
  }

  useEffect(() => {
    loadTodos();
  }, []);
  //#endregion function

  //#region handler

  function handleCloseErrorMessage() {
    setErrorMessage('');
  }

  function handlerAddTodo(event: React.FormEvent) {
    event.preventDefault();

    if (!todoTitle.trim()) {
      setErrorMessage('Title should not be empty');
      setTimeout(() => setErrorMessage(''), 3000);

      return;
    }

    const newTodo = {
      title: todoTitle,
      userId: USER_ID,
      completed: false,
    };

    const tempoNewTodo = {
      id: 0,
      title: todoTitle,
      userId: USER_ID,
      completed: false,
    };

    setTempoTodo(tempoNewTodo);

    setTodoTitle('');
    addTodo(newTodo);
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTodoTitle(event.target.value);
  }

  function handleDeleteTodo(id?: number) {
    if (id === undefined) {
      return;
    }

    deleteTodo(id);
  }

  function handleChangeStatus(todoId: number | undefined, newStatus: boolean) {
    if (!todoId) {
      return;
    }

    updateTodo(todoId, newStatus);
  }

  function handleFiltered(filter: string) {
    setFilterTerm(filter);
  }

  //#endregion handler

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handlerAddTodo}>
            <input
              ref={inputRef}
              data-cy="NewTodoField"
              value={todoTitle}
              onChange={handleTitleChange}
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              disabled={isLoadingTodo !== null}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <>
            <TodosList
              isLoadingTodo={isLoadingTodo}
              isLoading={isLoading}
              tempoTodo={tempoTodo}
              todos={filteredTodos}
              handleChangeStatus={handleChangeStatus}
              handleDeleteTodo={handleDeleteTodo}
            />

            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {leftItems} items left
              </span>

              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={classNames('filter__link', {
                    selected: filterTerm === '',
                  })}
                  data-cy="FilterLinkAll"
                  onClick={() => handleFiltered('')}
                >
                  All
                </a>

                <a
                  href="#/active"
                  className={classNames('filter__link', {
                    selected: filterTerm === 'active',
                  })}
                  data-cy="FilterLinkActive"
                  onClick={() => handleFiltered('active')}
                >
                  Active
                </a>

                <a
                  href="#/completed"
                  className={classNames('filter__link', {
                    selected: filterTerm === 'completed',
                  })}
                  data-cy="FilterLinkCompleted"
                  onClick={() => handleFiltered('completed')}
                >
                  Completed
                </a>
              </nav>

              {/* this button should be disabled if there are no completed todos */}
              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                onClick={() => handleFiltered('')}
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={handleCloseErrorMessage}
        />
        {errorMessage}
      </div>
    </div>
  );
};
