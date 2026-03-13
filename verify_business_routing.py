import asyncio
from unittest.mock import MagicMock, AsyncMock
from messaging.gateway import MessagingGateway
from core.router import MessageRouter

async def test_business_routing():
    # Mock dependencies
    mock_bot_client = MagicMock()
    mock_bot_client.send_message = AsyncMock()
    
    mock_business_client = MagicMock()
    mock_business_client.send_message = AsyncMock()
    
    mock_router = MagicMock()
    mock_router.route_message = AsyncMock(return_value="AI Reply for Business")
    
    gateway = MessagingGateway(
        bot_client=mock_bot_client,
        business_client=mock_business_client,
        router=mock_router
    )
    
    # Simulate a business message
    mock_message = MagicMock()
    mock_message.from_user.id = 12345
    mock_message.text = "Hello from business account"
    mock_message.business_connection_id = "conn_abc_123"
    
    print(f"Testing business message routing...")
    await gateway.handle_incoming(mock_message)
    
    # Verifications
    mock_router.route_message.assert_called_once()
    mock_business_client.send_message.assert_called_once_with(
        "12345", 
        "AI Reply for Business", 
        "conn_abc_123"
    )
    mock_bot_client.send_message.assert_not_called()
    
    print("DONE: Business routing test passed!")

    # Simulate a standard message
    mock_router.route_message.reset_mock()
    mock_business_client.send_message.reset_mock()
    mock_bot_client.send_message.reset_mock()
    
    mock_standard_message = MagicMock()
    mock_standard_message.from_user.id = 67890
    mock_standard_message.text = "Hello bot"
    mock_standard_message.business_connection_id = None # or missing
    
    print(f"Testing standard message routing...")
    await gateway.handle_incoming(mock_standard_message)
    
    # Verifications
    mock_router.route_message.assert_called_once()
    mock_bot_client.send_message.assert_called_once_with(
        "67890", 
        "AI Reply for Business"
    )
    mock_business_client.send_message.assert_not_called()
    
    print("DONE: Standard routing test passed!")

if __name__ == "__main__":
    asyncio.run(test_business_routing())
