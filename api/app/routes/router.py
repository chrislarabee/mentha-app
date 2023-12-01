from abc import ABC, abstractmethod
from typing import Callable, Generic
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.domain.core import DomainModelT, InputModelT
from app.storage.db import MenthaTable


class NotFoundException(HTTPException):
    def __init__(self, id: UUID) -> None:
        super().__init__(404, f"No record found with id {id}.")


class Router(ABC):
    @abstractmethod
    def create_fastapi_router(self) -> APIRouter:
        return NotImplemented


class BasicRouter(Router, Generic[DomainModelT, InputModelT], ABC):
    def __init__(
        self,
        *,
        singular_name: str,
        plural_name: str,
        domain_model: type[DomainModelT],
        input_model_decoder: Callable[[UUID, InputModelT], DomainModelT],
        table: MenthaTable[DomainModelT],
    ) -> None:
        self._singular = singular_name
        self._plural = plural_name
        self._table = table
        self._model = domain_model

        self._decode_input = input_model_decoder

    def create_fastapi_router(self) -> APIRouter:
        router = APIRouter(prefix="", tags=[self._plural])

        router.add_api_route(
            "/{id}",
            self.get,
            summary=f"Get {self._singular.title()}",
            response_model=self._model,
        )
        router.add_api_route(
            "/{id}",
            self.update,
            summary=f"Update {self._singular.title()}",
            response_model=self._model,
            methods=["PUT"],
        )
        router.add_api_route(
            "/{id}",
            self.delete,
            summary=f"Delete {self._singular.title()}",
            methods=["DELETE"],
        )
        router.add_api_route(
            "/",
            self.get_all,
            summary=f"Get All {self._plural.title()}",
        )
        router.add_api_route(
            "/",
            self.add,
            summary=f"Add {self._singular.title()}",
            response_model=UUID,
            methods=["POST"],
        )
        return router

    @abstractmethod
    async def add(self, input: InputModelT) -> UUID:
        """
        Takes the InputModel as a new record to create.

        You must override this method and change the InputModelT TypeVar, above,
        to the appropriate input model for your BasicRouter, otherwise, you will
        get errors before application startup.

        Args:
            input (InputModelT): The InputModel to create a record based off
            of.

        Returns:
            UUID: The UUID of the newly created record.
        """
        new = self._decode_input(uuid4(), input)
        await self._table.insert_async(new)
        return new.id

    async def get(self, id: UUID) -> DomainModelT:
        result = await self._table.get_async(id)
        if result is None:
            raise NotFoundException(id)
        else:
            return result

    async def get_all(self) -> list[DomainModelT]:
        """
        Returns all records from the database.

        You must override this method and change the DomainModelT TypeVar, above,
        to the appropriate model for your BasicRouter, otherwise, you will
        get errors before application startup.

        Returns:
            list[DomainModelT]: The list of all records.
        """
        results = await self._table.query_async()
        return results

    async def update(self, id: UUID, input: InputModelT) -> DomainModelT:
        """
        Takes the InputModel and uses it to update an existing record.

        You must override this method and change the InputModelT TypeVar, above,
        to the appropriate input model for your BasicRouter, otherwise, you will
        get errors before application startup.

        Args:
            id (UUID): The id of the record to update.
            input (InputModelT): The InputModel to update the record from.

        Raises:
            NotFoundException: If the passed id cannot be found.

        Returns:
            DomainModelT: The updated model.
        """
        current = await self._table.get_async(id)
        if not current:
            raise NotFoundException(id)

        result = self._decode_input(id, input)

        # Only edit if changes were actually made:
        if current != result:
            await self._table.update_async(result)

        return result

    async def delete(self, id: UUID) -> JSONResponse:
        await self._table.delete_async(id)
        return JSONResponse(f"{id} successfully deleted", status_code=204)
